import { UserType } from '../../generated/prisma/enums';

export interface JwtAccessPayload {
  userId: string;
  email: string;
  userType: UserType;
  sid: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  userType: UserType;
  sessionId: string;
}

export type TwoFactorTokenPayload = {
  userId: string;
};

// `passwordVersion` is users.password_updated_at (epoch ms) at the moment the
// token was issued. Resetting the password moves it, so a reset token can
// only ever be redeemed once.
export type PasswordResetTokenPayload = {
  userId: string;
  passwordVersion: number;
};
