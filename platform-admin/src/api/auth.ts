import { Axios } from "@/lib/axios";
import type { LoginPayload, LoginResponse, User } from "@/types";

export const authApi = {
  login: (loginPayload: LoginPayload) =>
    Axios.post<Partial<LoginResponse>>("/auth/login", loginPayload).then(
      (response) => response.data,
    ),

  me: () => Axios.get<User>("/auth/me").then((response) => response.data),
};
