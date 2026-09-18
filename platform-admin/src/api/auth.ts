import { Axios } from "@/lib/axios";
import type {
  ChangePasswordPayload,
  GenerateOtpResponse,
  LoginPayload,
  LoginResponse,
  LogoutResponse,
  UpdateProfilePayload,
  UpdateProfileResponse,
  User,
  Verify2FaLoginOtpPayload,
  VerifyEnableDisableTwoFactorPayload,
  VerifyOtpResponse,
} from "@/types";

export const authApi = {
  login: (loginPayload: LoginPayload) =>
    Axios.post<Partial<LoginResponse>>("/auth/login", loginPayload).then(
      (response) => response.data,
    ),

  me: () => Axios.get<User>("/auth/me").then((response) => response.data),

  logout: () =>
    Axios.post<LogoutResponse>("/auth/logout").then(
      (response) => response.data,
    ),

  updateUser: (payload: UpdateProfilePayload) =>
    Axios.put<UpdateProfileResponse>("/users/me", payload).then(
      (response) => response.data,
    ),

  changePassword: (payload: ChangePasswordPayload) =>
    Axios.put<UpdateProfileResponse>("/users/change-password", payload).then(
      (response) => response.data,
    ),

  twoFactorGenerateOtp: () =>
    Axios.post<GenerateOtpResponse>("/auth/2fa-generate-otp").then(
      (res) => res.data,
    ),

  verifyEnableDisableTwoFactor: (
    payload: VerifyEnableDisableTwoFactorPayload,
  ) =>
    Axios.post<VerifyOtpResponse>("/auth/2fa-verify-enable", payload).then(
      (res) => res.data,
    ),

  verify2FaLoginOtp: (payload: Verify2FaLoginOtpPayload) =>
    Axios.post<LoginResponse>("/auth/2fa-verify-login-otp", payload).then(
      (res) => res.data,
    ),
};
