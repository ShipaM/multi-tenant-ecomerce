import { validateEmail, validatePassword } from "@/lib/validators";
import type { LoginCredentials } from "./hooks/useLoginCredentials";

export type LoginFieldErrors = Partial<Record<keyof LoginCredentials, string>>;

export const validateLogin = ({
  email,
  password,
}: LoginCredentials): LoginFieldErrors => {
  const errors: LoginFieldErrors = {};
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  return errors;
};
