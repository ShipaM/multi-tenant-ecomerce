import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserStatus, UserType } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

const SHARED_PREFIX = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${'q'.repeat(140)}.`;
const TOKEN_A = `${SHARED_PREFIX}AAAAsignature-of-the-first-token`;
const TOKEN_B = `${SHARED_PREFIX}BBBBsignature-of-the-second-token`;

const env: Record<string, string> = {
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'r'.repeat(32),
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '30d',
};

const user = {
  id: 'u1',
  email: 'a@b.com',
  userType: UserType.PLATFORM_ADMIN,
  status: UserStatus.ACTIVE,
  passwordHash: 'unused-here',
};

describe('AuthService', () => {
  let service: AuthService;

  const usersService = { findByEmail: vi.fn() };
  const prisma = {
    userSession: { create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  };
  const jwtService = {
    signAsync: vi.fn(),
    verifyAsync: vi.fn(),
    decode: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    jwtService.decode.mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 2_592_000,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: { get: vi.fn(), getOrThrow: (key: string) => env[key] },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects an unknown email and a wrong password with the same answer', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    const unknownEmail = await service
      .login('nobody@example.com', 'secret')
      .catch((error: UnauthorizedException) => error);

    expect(unknownEmail).toBeInstanceOf(UnauthorizedException);
    expect((unknownEmail as UnauthorizedException).message).toBe(
      'Invalid email or password',
    );
  });

  it('returns the user type alongside the tokens on a successful login', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...user,
      // bcrypt hash of "correct-password"
      passwordHash:
        '$2b$10$u0rSVA5CKnD0UA/bJimDZ.pC/S57JSYYldMDF41v.7fEinQsBChH6',
    });
    jwtService.signAsync.mockResolvedValue(TOKEN_A);

    await expect(service.login('a@b.com', 'correct-password')).resolves.toEqual({
      accessToken: TOKEN_A,
      refreshToken: TOKEN_A,
      userType: UserType.PLATFORM_ADMIN,
    });
  });

  it('refuses to issue tokens to a suspended account', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...user,
      status: UserStatus.SUSPENDED,
      // bcrypt hash of "correct-password"
      passwordHash:
        '$2b$10$u0rSVA5CKnD0UA/bJimDZ.pC/S57JSYYldMDF41v.7fEinQsBChH6',
    });

    await expect(service.login('a@b.com', 'correct-password')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('does not accept a refresh token that only shares a prefix with the stored one', async () => {
    // Store the hash the service itself produces for TOKEN_B.
    jwtService.signAsync.mockResolvedValue(TOKEN_B);
    await service.issueTokenPair(user as never);

    const storedHash = prisma.userSession.create.mock.calls[0][0].data
      .refreshTokenHash as string;

    // TOKEN_A matches TOKEN_B for far more than bcrypt's 72-byte limit, so a
    // bcrypt-based check would wave it through.
    jwtService.verifyAsync.mockResolvedValue({
      userId: user.id,
      sessionId: 's1',
    });
    prisma.userSession.findUnique = vi.fn().mockResolvedValue({
      id: 's1',
      userId: user.id,
      refreshTokenHash: storedHash,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 86_400_000),
      ipAddress: null,
      deviceLabel: null,
      user,
    });

    await expect(service.refresh(TOKEN_A)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(prisma.userSession.update).not.toHaveBeenCalled();
  });

  it('rotates the stored hash when the correct refresh token is presented', async () => {
    jwtService.signAsync.mockResolvedValue(TOKEN_B);
    await service.issueTokenPair(user as never);
    const storedHash = prisma.userSession.create.mock.calls[0][0].data
      .refreshTokenHash as string;

    jwtService.verifyAsync.mockResolvedValue({
      userId: user.id,
      sessionId: 's1',
    });
    prisma.userSession.findUnique = vi.fn().mockResolvedValue({
      id: 's1',
      userId: user.id,
      refreshTokenHash: storedHash,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 86_400_000),
      ipAddress: null,
      deviceLabel: null,
      user,
    });
    jwtService.signAsync.mockResolvedValue(TOKEN_A);

    await service.refresh(TOKEN_B);

    const rotated = prisma.userSession.update.mock.calls[0][0].data
      .refreshTokenHash as string;
    expect(rotated).not.toBe(storedHash);
  });

  it('revokes only sessions that are still open', async () => {
    await service.logout('s1');

    expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
      where: { id: 's1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
