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
import { createHmac, timingSafeEqual } from 'node:crypto';
import { User } from '../generated/prisma/client.js';
import { UserStatus, UserType } from '../generated/prisma/enums.js';
import { ExpiresIn } from '../config/env.validation.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import {
  JwtAccessPayload,
  RefreshTokenPayload,
} from './types/jwt-payload.type.js';

export interface LoginContext {
  ipAddress?: string;
  deviceLabel?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends TokenPair {
  userType: UserType;
}

export type PublicUser = Omit<User, 'passwordHash' | 'twoFactorSecret'>;

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
    private readonly config: ConfigService,
  ) {}

  // Checks email + password and, if valid, starts a new session by issuing an access/refresh token pair.
  async login(
    email: string,
    password: string,
    context: LoginContext = {},
  ): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(email);

    // Use a real or dummy hash to keep timing consistent for all users.
    const passwordMatches = await bcrypt.compare(
      password,
      user?.passwordHash ?? ABSENT_USER_PASSWORD_HASH,
    );

    if (!user || !passwordMatches) {
      throw new BadRequestException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('This account is not active');
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
        deviceLabel: context.deviceLabel,
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
        deviceLabel: context.deviceLabel ?? session.deviceLabel,
      },
    });

    return tokens;
  }

  // Revokes the session; JwtStrategy checks revokedAt on every request, so the
  // existing access token stops working immediately, not just after it expires.
  async logout(sessionId: string): Promise<void> {
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
  private expiresIn(key: string): ExpiresIn {
    return this.config.getOrThrow<string>(key) as ExpiresIn;
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
}
