import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { PublicUser } from './types/public-user.type.js';

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

  async update(userId: string, dto: UpdateUserDto): Promise<PublicUser> {
    try {
      return await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: { ...dto },
        omit: { passwordHash: true, twoFactorSecret: true },
      });
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
}
