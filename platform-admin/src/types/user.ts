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
  id: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
  twoFactorEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
