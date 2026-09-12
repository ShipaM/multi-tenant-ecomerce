import { Axios } from "@/lib/axios";
import type {
  LoginPayload,
  LoginResponse,
  LogoutResponse,
  UpdateProfilePayload,
  User,
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
    Axios.put<User>("/users/me", payload).then((response) => response.data),
};
