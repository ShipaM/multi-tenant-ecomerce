import { User } from '../../generated/prisma/client';

// Shape returned to clients: the full Prisma User minus fields that must never leave the server.
export type PublicUser = Omit<User, 'passwordHash' | 'twoFactorSecret'>;

export type UpdateUserResponse = {
  user: PublicUser;
  message: string;
  success: boolean;
};
