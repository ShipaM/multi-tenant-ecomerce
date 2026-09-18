import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  const prisma = {
    user: { findUnique: vi.fn(), update: vi.fn() },
    userSession: { updateMany: vi.fn() },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('looks a user up by email', async () => {
    const user = { id: 'u1', email: 'a@b.com' };
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(service.findByEmail('a@b.com')).resolves.toBe(user);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'a@b.com' },
    });
  });

  describe('changePassword', () => {
    const existingUser = {
      id: 'u1',
      passwordHash: bcrypt.hashSync('old-password', 10),
    };

    it('rejects an incorrect current password without touching the account', async () => {
      prisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(
        service.changePassword('u1', {
          currentPassword: 'wrong-password',
          password: 'new-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('updates the password hash and revokes every other open session', async () => {
      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.user.update.mockResolvedValue({ id: 'u1' });

      await service.changePassword(
        'u1',
        { currentPassword: 'old-password', password: 'new-password' },
        's-current',
      );

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u1' } }),
      );
      expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'u1',
          revokedAt: null,
          id: { not: 's-current' },
        },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('revokes every open session, including the current one, when no session id is given', async () => {
      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.user.update.mockResolvedValue({ id: 'u1' });

      await service.changePassword('u1', {
        currentPassword: 'old-password',
        password: 'new-password',
      });

      expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
