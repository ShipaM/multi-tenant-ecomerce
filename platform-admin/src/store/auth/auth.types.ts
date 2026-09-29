import type { Session, User, UserType } from "@/types";

// Redux state for the auth slice — distinct from the API request/response
// contracts in `@/types/auth`, which describe what the backend sends/expects.
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  userType: UserType | null;
  error: string | null;
  isLoginLoading: boolean;
  isMeLoading: boolean;
  isLogoutLoading: boolean;
  isUpdateUserLoading: boolean;
  isChangePasswordLoading: boolean;
  isTwoFactorGenerateOtpLoading: boolean;
  isTwoFactorVerifyOtpLoading: boolean;
  isVerify2FaLoginOtpLoading: boolean;
  twoFactorToken: string | null;
  twoFactorRequired: boolean;
  sessions: Session[];
  isSessionsLoading: boolean;
}
