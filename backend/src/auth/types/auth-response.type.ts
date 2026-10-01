import { UserType } from '../../generated/prisma/enums';

export interface LoginContext {
  ipAddress?: string;
  device?: string;
  os?: string;
  browser?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends TokenPair {
  userType: UserType;
}

export interface TwoFactorChallengeResponse {
  twoFactorRequired: true;
  twoFactorToken: string;
  message: string;
}

// login() either signs the user in outright, or hands back a short-lived
// challenge token that must be redeemed via the 2FA verify endpoint.
export type LoginResult = LoginResponse | TwoFactorChallengeResponse;

export interface TwoFactorActionResponse {
  success: true;
  message: string;
}

export interface TwoFactorVerifyEnableResponse extends TwoFactorActionResponse {
  data: { twoFactorEnabled: boolean };
}

export interface TwoFactorOtpTokenResult {
  twoFactorToken: string;
  message: string;
}
