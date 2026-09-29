import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcryptjs';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { User } from '../generated/prisma/client.js';
import { TwoFactorOtpPurpose, UserStatus } from '../generated/prisma/enums.js';
import { EnvironmentVariables, ExpiresIn } from '../config/env.validation.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PublicUser } from '../users/types/public-user.type.js';
import { UsersService } from '../users/users.service.js';
import {
  JwtAccessPayload,
  RefreshTokenPayload,
  TwoFactorTokenPayload,
} from './types/jwt-payload.type.js';
import {
  LoginContext,
  LoginResult,
  TokenPair,
  TwoFactorActionResponse,
  TwoFactorOtpTokenResult,
  TwoFactorVerifyEnableResponse,
} from './types/auth-response.type.js';
import { EmailService } from '../email/email.service.js';
import { TwoFactorVerifyLoginOtpDto } from './dto/two-factor.dto.js';

const REFRESH_TOKEN_HASH_LABEL = 'refresh-token:';
// Prevents email enumeration by keeping bcrypt response time consistent.
const ABSENT_USER_PASSWORD_HASH =
  '$2b$10$GX4mLMIX82K.eEI3w8woCO8T3jagNaeEqpN24ykRftkNU9Prbtj4S';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly emailService: EmailService,
  ) {}

  // Checks email + password and, if valid, starts a new session by issuing an access/refresh token pair.
  async login(
    email: string,
    password: string,
    context: LoginContext = {},
  ): Promise<LoginResult> {
    const user = await this.usersService.findByEmail(email);

    // Use a real or dummy hash to keep timing consistent for all users.
    const passwordMatches = await bcrypt.compare(
      password,
      user?.passwordHash ?? ABSENT_USER_PASSWORD_HASH,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('This account is not active');
    }

    if (user.twoFactorEnabled) {
      const result = await this.twoFactorCreateOtpToken(user.id);

      return {
        twoFactorRequired: true,
        twoFactorToken: result.twoFactorToken,
        message: result.message,
      };
    }

    const tokens = await this.issueTokenPair(user, context);

    return { ...tokens, userType: user.userType };
  }

  // Creates a session and signs a token pair for revocation and refresh.
  async issueTokenPair(
    user: User,
    context: LoginContext = {},
  ): Promise<TokenPair> {
    const sessionId = createId();
    const tokens = await this.signTokenPair(user, sessionId);

    await this.prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        device: context.device,
        os: context.os,
        browser: context.browser,
        ipAddress: context.ipAddress,

        // The refresh token itself is never stored, only its hash — see
        // hashRefreshToken() below.
        refreshTokenHash: this.hashRefreshToken(tokens.refreshToken),
        expiresAt: this.refreshTokenExpiresAt(tokens.refreshToken),
      },
    });

    return tokens;
  }

  // Rotates the refresh token, replacing the old one with a new token pair.
  async refresh(
    refreshToken: string,
    context: LoginContext = {},
  ): Promise<TokenPair> {
    let payload: RefreshTokenPayload;

    // Step 1: the token must be a validly signed, non-expired JWT.
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET') },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Step 2: Validate that the session is active and not expired.
    const session = await this.prisma.userSession.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Step 3: Verify the token matches the session to prevent token forgery.
    if (!this.refreshTokenMatches(refreshToken, session.refreshTokenHash)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('This account is not active');
    }

    // Step 4: Rotate the token pair and save its hash to the same session.
    const tokens = await this.signTokenPair(session.user, session.id);

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: this.hashRefreshToken(tokens.refreshToken),
        expiresAt: this.refreshTokenExpiresAt(tokens.refreshToken),
        lastActiveAt: new Date(),
        ipAddress: context.ipAddress ?? session.ipAddress,
        deviceLabel: context.device ?? session.deviceLabel,
        os: context.os,
        browser: context.browser,
      },
    });

    return tokens;
  }

  // Revokes the session; JwtStrategy checks revokedAt on every request, so the
  // existing access token stops working immediately, not just after it expires.
  async logout(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session || session.userId !== userId) {
      throw new BadRequestException('Session not found');
    }

    await this.prisma.userSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // Signs access and refresh JWTs in parallel, each with its own secret and expiry.
  private async signTokenPair(
    user: User,
    sessionId: string,
  ): Promise<TokenPair> {
    const accessTokenPayload: JwtAccessPayload = {
      userId: user.id,
      email: user.email,
      userType: user.userType,
      sid: sessionId,
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      userId: user.id,
      sessionId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.expiresIn('JWT_ACCESS_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.expiresIn('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // Stores only the HMAC hash to keep leaked tokens unusable.
  private hashRefreshToken(refreshToken: string): string {
    return createHmac(
      'sha256',
      this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
    )
      .update(REFRESH_TOKEN_HASH_LABEL + refreshToken)
      .digest('hex');
  }

  // Safely compares token hashes to prevent timing attacks.
  private refreshTokenMatches(refreshToken: string, storedHash: string) {
    const candidate = Buffer.from(this.hashRefreshToken(refreshToken), 'hex');
    const stored = Buffer.from(storedHash, 'hex');

    return (
      candidate.length === stored.length && timingSafeEqual(candidate, stored)
    );
  }

  // Small helper so JWT expiry values (e.g. "15m", "7d") are read from config in one place.
  private expiresIn(
    key:
      'JWT_ACCESS_EXPIRES_IN' | 'JWT_REFRESH_EXPIRES_IN' | 'JWT_2FA_EXPIRES_IN',
  ): ExpiresIn {
    return this.config.getOrThrow(key);
  }

  // Reads the "exp" claim out of the freshly signed refresh JWT so the session row's expiresAt matches the token's real expiry exactly.
  private refreshTokenExpiresAt(refreshToken: string): Date {
    const { exp } = this.jwtService.decode<{ exp: number }>(refreshToken);

    return new Date(exp * 1000);
  }

  // Returns the current user's public profile (used by "GET /me"-style endpoints). Sensitive fields are excluded via Prisma's `omit`.
  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      omit: { passwordHash: true, twoFactorSecret: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid access token');
    }

    return user;
  }

  // Generates and emails an OTP for the given purpose. `purpose` keeps the
  // "turn 2FA on/off" flow and the "confirm a login" flow from ever accepting
  // each other's codes — see verifyOtp() below.
  async twoFactorEnable(
    userId: string,
    purpose: TwoFactorOtpPurpose = TwoFactorOtpPurpose.ENABLE_TOGGLE,
  ): Promise<TwoFactorActionResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid User Id');
    }

    const generateOtp = randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(generateOtp, 10);

    const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

    // Invalidate any still-live OTP of the same purpose so a resend can't
    // leave two valid codes in play (only the newest would ever be checked).
    await this.prisma.twoFactorOtp.updateMany({
      where: {
        userId: user.id,
        purpose,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { expiresAt: new Date() },
    });

    await this.prisma.twoFactorOtp.create({
      data: {
        userId: user.id,
        purpose,
        otpHash: otpHash,
        expiresAt: expiredAt,
      },
    });

    await this.emailService.sendOtp2FAuser(
      user.fullName,
      user.email,
      generateOtp,
      '5min',
    );

    return {
      success: true,
      message: 'Otp send successfully',
    };
  }

  // Looks up the newest unverified, unexpired OTP for this user and purpose,
  // enforces the attempt limit, and marks it verified on success. Shared by
  // both verify flows so their behavior (and error messages) can't drift.
  private async verifyOtp(
    userId: string,
    purpose: TwoFactorOtpPurpose,
    otp: string,
  ): Promise<void> {
    const otpData = await this.prisma.twoFactorOtp.findFirst({
      where: {
        userId,
        purpose,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpData) {
      throw new BadRequestException('Otp expired or invalid');
    }

    if (otpData.attempts >= 5) {
      throw new BadRequestException('Too many otp attempts');
    }

    const isOtpValid = await bcrypt.compare(otp, otpData.otpHash);

    if (!isOtpValid) {
      await this.prisma.twoFactorOtp.update({
        where: {
          id: otpData.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });
      throw new BadRequestException('Invalid Otp');
    }

    await this.prisma.twoFactorOtp.update({
      where: {
        id: otpData.id,
      },
      data: {
        verifiedAt: new Date(),
      },
    });
  }

  async twoFactorVerifyEnable(
    userId: string,
    otp: string,
  ): Promise<TwoFactorVerifyEnableResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid User Id');
    }

    await this.verifyOtp(userId, TwoFactorOtpPurpose.ENABLE_TOGGLE, otp);

    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        twoFactorEnabled: !user.twoFactorEnabled,
      },
    });

    return {
      success: true,
      message: `Two-factor ${updatedUser.twoFactorEnabled ? 'enabled' : 'disabled'}`,
      data: {
        twoFactorEnabled: updatedUser.twoFactorEnabled,
      },
    };
  }

  async twoFactorCreateOtpToken(
    userId: string,
  ): Promise<TwoFactorOtpTokenResult> {
    const payload: TwoFactorTokenPayload = { userId };

    await this.twoFactorEnable(userId, TwoFactorOtpPurpose.LOGIN);

    const twoFactorToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_2FA_SECRET'),
      expiresIn: this.expiresIn('JWT_2FA_EXPIRES_IN'),
    });

    return { twoFactorToken, message: 'Otp send successfully' };
  }

  async twoFactorVerifyLoginOtp(
    twoFactorToken: TwoFactorVerifyLoginOtpDto['twoFactorToken'],
    otp: TwoFactorVerifyLoginOtpDto['otp'],
    context: LoginContext = {},
  ) {
    let decode: TwoFactorTokenPayload;

    try {
      decode = await this.jwtService.verifyAsync<TwoFactorTokenPayload>(
        twoFactorToken,
        { secret: this.config.getOrThrow<string>('JWT_2FA_SECRET') },
      );
    } catch {
      throw new BadRequestException('Session is Expired');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: decode.userId,
      },
    });

    if (!user) {
      throw new BadRequestException('Something went wrong');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('This account is not active');
    }

    await this.verifyOtp(user.id, TwoFactorOtpPurpose.LOGIN, otp);

    const token = await this.issueTokenPair(user, context);
    return {
      ...token,
      userType: user.userType,
    };
  }

  async listSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new BadRequestException('Session not found');
    }

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeOtherSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { userId: userId, revokedAt: null, NOT: { id: currentSessionId } },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });

    let createdAt = new Date();

    if (user) {
      const generateotp = randomInt(100000, 1000000).toString();
      const otpHash = await bcrypt.hash(generateotp, 10);
      const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

      const otp = await this.prisma.passwordResetOtp.create({
        data: {
          userId: user.id,
          codeHash: otpHash,
          expiresAt: expiredAt,
        },
      });
      createdAt = otp.createdAt;

      await this.emailService.sendOtpForgotPassword(
        user.fullName,
        user.email,
        generateotp,
        '5 Min',
      );
    }

    return {
      success: true,
      message: 'Otp send to your email successfully',
      data: { createdAt },
    };
  }

  async forgotPasswordOtpVerification(email: string, otp: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('Otp does not match');
    }

    const passwordResetOtp = await this.prisma.passwordResetOtp.findFirst({
      where: { userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!passwordResetOtp) {
      throw new BadRequestException('Otp expired or invalid');
    }

    if (passwordResetOtp.attempts >= 5) {
      throw new BadRequestException('Too many otp attempts');
    }

    const decodeHashOtp = await bcrypt.compare(otp, passwordResetOtp.codeHash);

    if (!decodeHashOtp) {
      await this.prisma.passwordResetOtp.update({
        where: { id: passwordResetOtp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Otp does not match');
    }

    await this.prisma.passwordResetOtp.update({
      where: { id: passwordResetOtp.id },
      data: { consumedAt: new Date() },
    });

    const resetTokenPayload = { userId: user.id };

    const resetToken = await this.jwtService.signAsync(resetTokenPayload, {
      secret: this.config.getOrThrow<string>('JWT_RESET_SECRET'),
      expiresIn: this.config.getOrThrow('JWT_RESET_EXPIRES_IN', '5m'),
    });
    return {
      success: true,
      message: 'Otp verify successfully',
      data: {
        resetToken,
      },
    };
  }

  async resetPassword(token: string, password: string) {
    const decode = await this.jwtService.verifyAsync<RefreshTokenPayload>(
      token,
      {
        secret: this.config.getOrThrow<string>('JWT_RESET_SECRET'),
      },
    );

    if (!decode) {
      throw new BadRequestException('Session will be expired');
    }

    const responseChangePassword =
      await this.usersService.resetForgottenPassword(decode.userId, {
        password: password,
      });

    return responseChangePassword;
  }
}
