import { isUserType, type UserType } from "@/types/user";

// Mirrors backend/src/auth/dto/login-dto.ts LoginDto.
export type LoginPayload = {
  email: string;
  password: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type CompleteLoginResponse = TokenPair & {
  userType: UserType;
};

export interface TwoFactorLoginResponse {
  twoFactorRequired: true;
  twoFactorToken: string;
  message: string;
}

export type LoginResponse = Partial<CompleteLoginResponse> &
  Partial<TwoFactorLoginResponse>;

export const isCompleteLoginResponse = (
  data: LoginResponse,
): data is CompleteLoginResponse =>
  typeof data.accessToken === "string" &&
  data.accessToken.length > 0 &&
  typeof data.refreshToken === "string" &&
  data.refreshToken.length > 0 &&
  isUserType(data.userType);

export const isTwoFactorRequiredResponse = (
  data: LoginResponse,
): data is TwoFactorLoginResponse =>
  data.twoFactorRequired === true && typeof data.twoFactorToken === "string";

export type LogoutResponse = {
  success: boolean;
};

export type GenerateOtpResponse = {
  success: boolean;
  message: string;
};

export type VerifyOtpResponse = {
  success: boolean;
  message: string;
  data: { twoFactorEnabled: boolean };
};

// Mirrors backend/src/auth/dto/two-factor.dto.ts TwoFactorDto.
export type VerifyEnableDisableTwoFactorPayload = {
  otp: string;
};

// Mirrors backend/src/auth/dto/two-factor.dto.ts TwoFactorVerifyLoginOtpDto.
export type Verify2FaLoginOtpPayload = {
  twoFactorToken: string;
  otp: string;
};

// Shared shape for react-router `location.state` across the
// login -> 2FA -> forgot-password -> reset-password navigation chain.
// Each page reads only the fields it needs.
export type AuthNavigationState = {
  email?: string;
  twoFactorToken?: string;
  redirectTo?: string;
  resetToken?: string;
};
