import { UserType } from '../../generated/prisma/enums.js';

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
