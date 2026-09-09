import { Axios } from "@/lib/axios";
import { isUserType, type USER_TYPE } from "@/types/user";

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  userType: USER_TYPE;
};
export const isCompleteLoginResponse = (
  data: Partial<LoginResponse>,
): data is LoginResponse =>
  typeof data.accessToken === "string" &&
  data.accessToken.length > 0 &&
  typeof data.refreshToken === "string" &&
  data.refreshToken.length > 0 &&
  isUserType(data.userType);

export const authApi = {
  login: (loginPayload: LoginPayload) =>
    Axios.post<Partial<LoginResponse>>("/auth/login", loginPayload).then(
      (response) => response.data,
    ),
};
