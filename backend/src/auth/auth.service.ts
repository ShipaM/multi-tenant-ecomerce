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

import { User } from '../generated/prisma/client';
import { TwoFactorOtpPurpose, UserStatus } from '../generated/prisma/enums';

import { EnvironmentVariables, ExpiresIn } from '../config/env.validation';

import { PrismaService } from '../prisma/prisma.service';
import { PublicUser } from '../users/types/public-user.type';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

import {
  JwtAccessPayload,
  PasswordResetTokenPayload,
  RefreshTokenPayload,
  TwoFactorTokenPayload,
} from './types/jwt-payload.type';

import {
  LoginContext,
  LoginResult,
  TokenPair,
  TwoFactorActionResponse,
  TwoFactorOtpTokenResult,
  TwoFactorVerifyEnableResponse,
} from './types/auth-response.type';

import { TwoFactorVerifyLoginOtpDto } from './dto';

// Prefixes the refresh token before hashing to separate this HMAC
// from any other hashes generated with the same secret.
const REFRESH_TOKEN_HASH_LABEL = 'refresh-token:';

// Used when an email does not exist. Comparing against a dummy hash
// helps prevent attackers from discovering registered email addresses
// by measuring differences in response time.
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

  // ============================================================
  // AUTHENTICATION
  // ============================================================

  //Authenticates a user using email and password.

  // If 2FA is enabled, starts the OTP verification flow.
  //Otherwise, creates a new session and returns an access/refresh token pair.

  async login(
    email: string,
    password: string,
    context: LoginContext = {},
  ): Promise<LoginResult> {
    // 1. Find the user by email.
    const user = await this.usersService.findByEmail(email);

    // 2. Verify the password.
    // Use a dummy hash if the user does not exist to keep response times similar.
    const passwordMatches = await bcrypt.compare(
      password,
      user?.passwordHash ?? ABSENT_USER_PASSWORD_HASH,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Only active users can log in.
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('This account is not active');
    }

    // 4. If 2FA is enabled, require an additional OTP verification.
    if (user.twoFactorEnabled) {
      const result = await this.twoFactorCreateOtpToken(user.id);

      return {
        twoFactorRequired: true,
        twoFactorToken: result.twoFactorToken,
        message: result.message,
      };
    }

    // 5. Create a session and issue both JWTs.
    const tokens = await this.issueTokenPair(user, context);

    return {
      ...tokens,
      userType: user.userType,
    };
  }

  // ============================================================
  // TOKEN MANAGEMENT
  // ============================================================

  // Creates a new database session and issues an access/refresh token pair.

  // The session connects both tokens to a single record in the database.
  // Only the refresh token hash is stored, never the original token.

  async issueTokenPair(
    user: User,
    context: LoginContext = {},
  ): Promise<TokenPair> {
    // Generate a unique ID for this login session.
    const sessionId = createId();

    // Create both JWTs using the same session ID.
    const tokens = await this.signTokenPair(user, sessionId);

    // Store the session and the refresh token hash in the database.
    await this.prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        device: context.device,
        os: context.os,
        browser: context.browser,
        ipAddress: context.ipAddress,
        refreshTokenHash: this.hashRefreshToken(tokens.refreshToken),
        expiresAt: this.refreshTokenExpiresAt(tokens.refreshToken),
      },
    });

    return tokens;
  }

  // Verifies a refresh token and issues a new token pair.
  // This is called when the access token expires.
  // The old refresh token is replaced with a new one (token rotation).

  async refresh(
    refreshToken: string,
    context: LoginContext = {},
  ): Promise<TokenPair> {
    let payload: RefreshTokenPayload;

    // 1. Verify the refresh JWT signature and expiration.
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2. Find the session associated with this token.
    const session = await this.prisma.userSession.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });

    // 3. Make sure the session still exists and is active.
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 4. Check that the provided token matches the hash stored in the session.
    // A validly signed token that no longer matches was already rotated away,
    // so it is being replayed: either a thief or the owner holds a stale copy.
    // We cannot tell which, so the whole session is revoked (reuse detection)
    // and the legitimate owner has to sign in again.
    if (!this.refreshTokenMatches(refreshToken, session.refreshTokenHash)) {
      await this.prisma.userSession.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 5. The user must still have an active account.
    if (session.user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('This account is not active');
    }

    // 6. Issue a new token pair for the existing session.
    const tokens = await this.signTokenPair(session.user, session.id);

    // 7. Replace the old refresh token hash with the new one.
    // The session ID remains unchanged.
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

  // Signs an access token and a refresh token.
  // Both tokens belong to the same session but have different payloads,
  // secrets and expiration times.

  private async signTokenPair(
    user: User,
    sessionId: string,
  ): Promise<TokenPair> {
    // Access token: used to authorize regular API requests.
    const accessTokenPayload: JwtAccessPayload = {
      userId: user.id,
      email: user.email,
      userType: user.userType,
      sid: sessionId,
    };

    // Refresh token: used only to obtain a new token pair.
    const refreshTokenPayload: RefreshTokenPayload = {
      userId: user.id,
      sessionId,
    };

    // Both tokens can be signed independently, so we create them in parallel.
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

  // ============================================================
  // SESSION MANAGEMENT
  // ============================================================

  // Logs out the current session by setting revokedAt.
  // The session is not deleted because we keep its history.
  // JwtStrategy checks revokedAt on every protected request,
  //so the existing access token stops working immediately.

  async logout(userId: string, sessionId: string): Promise<void> {
    // Make sure the session belongs to the current user.
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session || session.userId !== userId) {
      throw new BadRequestException('Session not found');
    }

    // Revoke the session if it has not already been revoked.
    await this.prisma.userSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // Returns all active sessions belonging to the user.
  // The most recently active session is returned first.

  async listSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        lastActiveAt: 'desc',
      },
    });
  }

  // Revokes a specific session.
  // The user can only revoke their own sessions.

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

  // Revokes all active sessions except the current one.

  //Useful when the user wants to log out from all other devices.

  async revokeOtherSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        NOT: { id: currentSessionId },
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  // ============================================================
  // TOKEN HELPERS
  // ============================================================

  // Creates an HMAC-SHA256 hash of the refresh token.
  // We never store the original refresh token in the database.
  // HMAC uses the refresh secret as an additional protection
  // if the database is compromised.

  private hashRefreshToken(refreshToken: string): string {
    return createHmac(
      'sha256',
      this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
    )
      .update(REFRESH_TOKEN_HASH_LABEL + refreshToken)
      .digest('hex');
  }

  // Compares the provided refresh token with its stored hash.

  // timingSafeEqual prevents the comparison time from revealing
  // how many bytes of the hashes match.

  private refreshTokenMatches(
    refreshToken: string,
    storedHash: string,
  ): boolean {
    const candidate = Buffer.from(this.hashRefreshToken(refreshToken), 'hex');

    const stored = Buffer.from(storedHash, 'hex');

    // timingSafeEqual requires buffers of equal length.
    return (
      candidate.length === stored.length && timingSafeEqual(candidate, stored)
    );
  }

  //Reads JWT expiration settings from the application configuration.
  // Keeps all expiration settings in one place.

  private expiresIn(
    key:
      'JWT_ACCESS_EXPIRES_IN' | 'JWT_REFRESH_EXPIRES_IN' | 'JWT_2FA_EXPIRES_IN',
  ): ExpiresIn {
    return this.config.getOrThrow(key);
  }

  //Extracts the expiration timestamp from a freshly signed refresh token.

  // JWT exp is expressed in seconds, while JavaScript Date uses milliseconds.
  // This keeps the database session expiration aligned with the JWT.

  private refreshTokenExpiresAt(refreshToken: string): Date {
    const { exp } = this.jwtService.decode<{ exp: number }>(refreshToken);

    return new Date(exp * 1000);
  }

  // ============================================================
  // USER PROFILE
  // ============================================================

  // Returns the authenticated user's public profile.
  // Sensitive fields are excluded directly in the Prisma query.

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      omit: {
        passwordHash: true,
        twoFactorSecret: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid access token');
    }

    return user;
  }

  // ============================================================
  // TWO-FACTOR AUTHENTICATION (2FA)
  // ============================================================

  // Generates an OTP, stores its hash and sends the code by email.

  // The purpose determines which flow can use this OTP:

  // - ENABLE_TOGGLE: enabling or disabling 2FA.
  // - LOGIN: confirming a login with 2FA.
  // Keeping purposes separate prevents an OTP from one flow
  // from being reused in another.

  async twoFactorEnable(
    userId: string,
    purpose: TwoFactorOtpPurpose = TwoFactorOtpPurpose.ENABLE_TOGGLE,
  ): Promise<TwoFactorActionResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Invalid User Id');
    }

    // Generate a cryptographically secure six-digit OTP.
    const generateOtp = randomInt(100000, 1000000).toString();

    // Store only the bcrypt hash, never the original OTP.
    const otpHash = await bcrypt.hash(generateOtp, 10);

    // OTP is valid for five minutes.
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

    // Invalidate previous active OTPs of the same purpose.
    // This ensures that only the newest code can be used.
    await this.prisma.twoFactorOtp.updateMany({
      where: {
        userId: user.id,
        purpose,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        expiresAt: new Date(),
      },
    });

    // Save the new OTP hash.
    await this.prisma.twoFactorOtp.create({
      data: {
        userId: user.id,
        purpose,
        otpHash,
        expiresAt: expiredAt,
      },
    });

    // Send the original OTP to the user's email.
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

  //Validates an OTP for a specific user and purpose.

  // Checks:
  // 1. OTP exists and has not expired.
  // 2. OTP has not already been verified.
  // 3. The maximum number of attempts has not been reached.
  // 4. The provided code matches the stored hash.

  // On success, marks the OTP as verified.

  private async verifyOtp(
    userId: string,
    purpose: TwoFactorOtpPurpose,
    otp: string,
  ): Promise<void> {
    // Find the newest active OTP for this user and purpose.
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

    // Stop checking codes after five failed attempts.
    if (otpData.attempts >= 5) {
      throw new BadRequestException('Too many otp attempts');
    }

    // Compare the submitted code with the stored bcrypt hash.
    const isOtpValid = await bcrypt.compare(otp, otpData.otpHash);

    if (!isOtpValid) {
      // Increment the failed attempt counter.
      await this.prisma.twoFactorOtp.update({
        where: { id: otpData.id },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      throw new BadRequestException('Invalid Otp');
    }

    // Mark the OTP as used so it cannot be reused.
    await this.prisma.twoFactorOtp.update({
      where: { id: otpData.id },
      data: {
        verifiedAt: new Date(),
      },
    });
  }

  //Enables or disables 2FA after successful OTP verification.
  // The current twoFactorEnabled value is inverted.

  async twoFactorVerifyEnable(
    userId: string,
    otp: string,
  ): Promise<TwoFactorVerifyEnableResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Invalid User Id');
    }

    // Verify the OTP generated for the 2FA settings flow.
    await this.verifyOtp(userId, TwoFactorOtpPurpose.ENABLE_TOGGLE, otp);

    // Toggle the current 2FA state.
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
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

  // Starts the 2FA login flow.

  // Sends an OTP and creates a short-lived JWT that identifies the user.
  // This token is temporary and cannot be used as an access token.

  async twoFactorCreateOtpToken(
    userId: string,
  ): Promise<TwoFactorOtpTokenResult> {
    const payload: TwoFactorTokenPayload = { userId };

    // Generate and email an OTP specifically for login verification.
    await this.twoFactorEnable(userId, TwoFactorOtpPurpose.LOGIN);

    // Create a temporary token that the client must send with the OTP.
    const twoFactorToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_2FA_SECRET'),
      expiresIn: this.expiresIn('JWT_2FA_EXPIRES_IN'),
    });

    return {
      twoFactorToken,
      message: 'Otp send successfully',
    };
  }

  // Completes login after successful 2FA verification.
  // Verifies the temporary 2FA token, checks the user and validates the OTP.
  // Only then creates a normal session and returns access/refresh tokens.

  async twoFactorVerifyLoginOtp(
    twoFactorToken: TwoFactorVerifyLoginOtpDto['twoFactorToken'],
    otp: TwoFactorVerifyLoginOtpDto['otp'],
    context: LoginContext = {},
  ) {
    let payload: TwoFactorTokenPayload;

    // 1. Verify the temporary 2FA token.
    try {
      payload = await this.jwtService.verifyAsync<TwoFactorTokenPayload>(
        twoFactorToken,
        {
          secret: this.config.getOrThrow<string>('JWT_2FA_SECRET'),
        },
      );
    } catch {
      throw new BadRequestException('Session is Expired');
    }

    // 2. Find the user identified by the temporary token.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new BadRequestException('Something went wrong');
    }

    // 3. Make sure the account is still active.
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('This account is not active');
    }

    // 4. Verify the OTP generated specifically for login.
    await this.verifyOtp(user.id, TwoFactorOtpPurpose.LOGIN, otp);

    // 5. Authentication is complete. Create a normal session and JWT pair.
    const tokens = await this.issueTokenPair(user, context);

    return {
      ...tokens,
      userType: user.userType,
    };
  }

  // ============================================================
  // PASSWORD RECOVERY
  // ============================================================

  // Starts the password recovery process.

  // If the email exists, generates and emails an OTP.
  // Returns the same general success response even when the user
  //does not exist, to avoid revealing registered email addresses.

  async forgotPassword(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Keep the response structure similar for existing and missing users.
    let createdAt = new Date();

    if (user) {
      // Generate a six-digit OTP and store only its hash.
      const generateOtp = randomInt(100000, 1000000).toString();
      const otpHash = await bcrypt.hash(generateOtp, 10);

      // The password recovery OTP is valid for five minutes.
      const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

      const otp = await this.prisma.passwordResetOtp.create({
        data: {
          userId: user.id,
          codeHash: otpHash,
          expiresAt: expiredAt,
        },
      });

      createdAt = otp.createdAt;

      // Send the OTP to the user's email.
      await this.emailService.sendOtpForgotPassword(
        user.fullName,
        user.email,
        generateOtp,
        '5 Min',
      );
    }

    return {
      success: true,
      message: 'Otp send to your email successfully',
      data: { createdAt },
    };
  }

  // Verifies the password recovery OTP.

  // On success, consumes the OTP and returns a short-lived reset JWT.
  // This JWT is required to set a new password.

  async forgotPasswordOtpVerification(email: string, otp: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    // Find the account associated with the email.
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Otp does not match');
    }

    // Find the newest unused and unexpired recovery OTP.
    const passwordResetOtp = await this.prisma.passwordResetOtp.findFirst({
      where: {
        userId: user.id,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!passwordResetOtp) {
      throw new BadRequestException('Otp expired or invalid');
    }

    // Enforce the maximum number of verification attempts.
    if (passwordResetOtp.attempts >= 5) {
      throw new BadRequestException('Too many otp attempts');
    }

    // Compare the submitted OTP with the stored hash.
    const isOtpValid = await bcrypt.compare(otp, passwordResetOtp.codeHash);

    if (!isOtpValid) {
      // Count the failed attempt.
      await this.prisma.passwordResetOtp.update({
        where: { id: passwordResetOtp.id },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      throw new BadRequestException('Otp does not match');
    }

    // Mark the OTP as consumed so it cannot be reused.
    await this.prisma.passwordResetOtp.update({
      where: { id: passwordResetOtp.id },
      data: {
        consumedAt: new Date(),
      },
    });

    // Include the current password version in the reset token.
    // This allows the password update flow to detect an outdated token.
    const resetTokenPayload: PasswordResetTokenPayload = {
      userId: user.id,
      passwordVersion: user.passwordUpdatedAt.getTime(),
    };

    // Issue a short-lived token that authorizes password reset only.
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

  // Resets the user's password using the temporary reset token.

  // The reset token is verified before delegating the password update
  // to UsersService.

  async resetPassword(token: string, password: string) {
    let payload: PasswordResetTokenPayload;

    // Verify the reset token signature and expiration.
    try {
      payload = await this.jwtService.verifyAsync<PasswordResetTokenPayload>(
        token,
        {
          secret: this.config.getOrThrow<string>('JWT_RESET_SECRET'),
        },
      );
    } catch {
      throw new BadRequestException('Session is Expired');
    }

    // UsersService handles password hashing and the actual database update.
    // passwordVersion can be used to reject outdated reset tokens.
    return this.usersService.resetForgottenPassword(
      payload.userId,
      { password },
      payload.passwordVersion,
    );
  }
}
