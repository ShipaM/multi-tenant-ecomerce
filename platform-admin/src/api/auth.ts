import { Axios } from "@/lib/axios";
import type {
  ChangePasswordPayload,
  ForgotPasswordOtpVerifyResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  GenerateOtpResponse,
  LoginPayload,
  LoginResponse,
  ResetPasswordPayload,
  SessionPayload,
  SessionsResponse,
  SuccessResponse,
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
    Axios.post<SuccessResponse>("/auth/logout").then(
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

  sessions: () =>
    Axios.get<SessionsResponse>("/auth/sessions").then((res) => res.data),

  sessionRevoke: (payload: SessionPayload) =>
    Axios.post<SuccessResponse>(
      `/auth/sessions/${payload.sessionId}/revoke`,
    ).then((res) => res.data),

  sessionRevokeOthers: () =>
    Axios.post<SuccessResponse>("/auth/sessions/revoke-others").then(
      (res) => res.data,
    ),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    Axios.post<ForgotPasswordResponse>("/auth/forgot-password", payload).then(
      (res) => res.data,
    ),

  forgotPasswordOtpVerify: (payload: ForgotPasswordPayload) =>
    Axios.post<ForgotPasswordOtpVerifyResponse>(
      "/auth/forgot-password/verify-otp",
      payload,
    ).then((res) => res.data),

  resetForgottenPassword: (payload: ResetPasswordPayload) =>
    Axios.post<UpdateProfileResponse>("/auth/reset-password", payload).then(
      (res) => res.data,
    ),
};
