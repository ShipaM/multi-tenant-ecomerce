import type { AsyncStatus } from "@/types/async";
import { isUserType, type User, type USER_TYPE } from "@/types/user";

export type LoginPayload = {
  email: string;
  password: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = TokenPair & {
  userType: USER_TYPE;
};

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  userType: USER_TYPE | null;
  status: AsyncStatus;
  error: string | null;
}

export const isCompleteLoginResponse = (
  data: Partial<LoginResponse>,
): data is LoginResponse =>
  typeof data.accessToken === "string" &&
  data.accessToken.length > 0 &&
  typeof data.refreshToken === "string" &&
  data.refreshToken.length > 0 &&
  isUserType(data.userType);
