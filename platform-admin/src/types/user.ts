import type { Role } from "./role";

export const USER_TYPES = [
  "CUSTOMER",
  "SELLER",
  "PLATFORM_ADMIN",
  "DELIVERY_AGENT",
] as const;

export type UserType = (typeof USER_TYPES)[number];

export const isUserType = (value: unknown): value is UserType =>
  typeof value === "string" && USER_TYPES.includes(value as UserType);

export type User = {
  email: string;
  fullName: string;
  userType: UserType;
  profileImage?: string;
  id: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
  twoFactorEnabled?: boolean;
  twoFactorSecret?: boolean;
  createdAt: Date;
  updatedAt: Date;
  passwordUpdatedAt?: Date;
  role?: Role;
  // Initials derived on the client from fullName/email for the avatar fallback.
  avatarName?: string;
};

// Fields the owner can edit on their own profile via PUT /users/me — mirrors
// backend/src/users/dto/update-user.dto.ts.
export type UpdateProfilePayload = {
  fullName: string;
  email: string;
  phone: string;
  profileImage?: string;
};

// Mirrors backend/src/users/dto/change-password.dto.ts.
export type ChangePasswordPayload = {
  currentPassword: string;
  password: string;
};

// Mirrors backend/src/users/types/public-user.type.ts UpdateUserResponse.
export type UpdateProfileResponse = {
  user: User;
  message: string;
  success: boolean;
};

export type Session = {
  deviceLabel: string | null;
  ipAddress: string;
  lastActiveAt: Date;
  sessionId: string;
  expiresAt: Date;
  createdAt: Date;
  isCurrent: boolean;
  os: string | null;
  device: string | null;
  browser: string | null;
};
