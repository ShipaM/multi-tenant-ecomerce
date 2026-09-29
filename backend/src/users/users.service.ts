import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateUserResponse } from './types/public-user.type.js';
import bcrypt from 'bcryptjs';
import { ResetForgottenPasswordDto } from './dto/reset-forgotten-password.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async update(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<UpdateUserResponse> {
    try {
      const user = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: { ...dto },
        omit: { passwordHash: true, twoFactorSecret: true },
      });

      return { user, message: 'Updated successfully', success: true };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already in use');
      }

      throw error;
    }
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    currentSessionId?: string,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) throw new BadRequestException('Invalid user');

    const currentPasswordMatches = await bcrypt.compare(
      dto.currentPassword,
      existingUser.passwordHash,
    );

    if (!currentPasswordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { passwordHash, passwordUpdatedAt: new Date() },
        omit: { passwordHash: true, twoFactorSecret: true },
      });

      // A changed password should invalidate any other session an attacker
      // (or a stolen refresh token) might already be holding, without
      // signing the requester themselves out of the session they just used.
      await tx.userSession.updateMany({
        where: {
          userId,
          revokedAt: null,
          ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
        },
        data: { revokedAt: new Date() },
      });

      return updatedUser;
    });

    return { user, message: 'Password changed successfully', success: true };
  }

  async resetForgottenPassword(
    userId: string,
    dto: ResetForgottenPasswordDto,
    currentSessionId?: string,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) throw new BadRequestException('Invalid user');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { passwordHash, passwordUpdatedAt: new Date() },
        omit: { passwordHash: true, twoFactorSecret: true },
      });

      // A changed password should invalidate any other session an attacker
      // (or a stolen refresh token) might already be holding, without
      // signing the requester themselves out of the session they just used.
      await tx.userSession.updateMany({
        where: {
          userId,
          revokedAt: null,
          ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
        },
        data: { revokedAt: new Date() },
      });

      return updatedUser;
    });

    return { user, message: 'Password changed successfully', success: true };
  }
}
