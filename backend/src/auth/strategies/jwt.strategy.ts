import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser, JwtAccessPayload } from '../types/jwt-payload.type';

const LAST_ACTIVE_TOUCH_MS = 60_000;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // Get the JWT from the Authorization: Bearer <token> header.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Reject tokens that are already expired.
      ignoreExpiration: false,

      // Use this secret to verify the JWT signature.
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtAccessPayload): Promise<AuthenticatedUser> {
    // Find the session stored in the database.
    const session = await this.prisma.userSession.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });

    // Reject the request if the session is missing, revoked, or expired.
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    // Only active users can access protected resources.
    if (session.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('This account is not active');
    }

    // Keep "last active" accurate without a write on every request:
    // touch the row at most once per interval, and don't block the request.
    if (Date.now() - session.lastActiveAt.getTime() > LAST_ACTIVE_TOUCH_MS) {
      void this.prisma.userSession
        .updateMany({
          where: { id: session.id, revokedAt: null },
          data: { lastActiveAt: new Date() },
        })
        .catch(() => undefined);
    }

    // Return user data that will be available in the request.
    return {
      userId: session.userId,
      email: session.user.email,
      userType: session.user.userType,
      sessionId: session.id,
    };
  }
}
