export const USER_TYPES = [
  "CUSTOMER",
  "SELLER",
  "PLATFORM_ADMIN",
  "DELIVERY_AGENT",
] as const;

export type USER_TYPE = (typeof USER_TYPES)[number];

export const isUserType = (value: unknown): value is USER_TYPE =>
  typeof value === "string" && USER_TYPES.includes(value as USER_TYPE);

export interface User {
  email: string;
  fullName: string;
  userType: USER_TYPE;
  profileImage?: string;
  id: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
  twoFactorEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Initials derived on the client from fullName/email for the avatar fallback.
  avatarName?: string;
}

// Fields the owner can edit on their own profile via PUT /users/me — mirrors
// backend/src/users/dto/update-user.dto.ts.
export type UpdateProfilePayload = {
  fullName: string;
  email: string;
  phone: string;
  profileImage?: string;
};
