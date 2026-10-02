import { useState, type ChangeEvent } from "react";

type UseResetPasswordFormResult = {
  password: string;
  confirmPassword: string;
  /** True once the user has typed a confirmation that differs from the password. */
  isMismatch: boolean;
  onPasswordChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onConfirmPasswordChange: (e: ChangeEvent<HTMLInputElement>) => void;
  resetForm: () => void;
};

export const useResetPasswordForm = (): UseResetPasswordFormResult => {
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  return {
    password,
    confirmPassword,
    isMismatch: confirmPassword.length > 0 && password !== confirmPassword,
    onPasswordChange: (e) => setPassword(e.target.value),
    onConfirmPasswordChange: (e) => setConfirmPassword(e.target.value),
    resetForm: () => {
      setPassword("");
      setConfirmPassword("");
    },
  };
};
