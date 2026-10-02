import { useState } from "react";
import { validateConfirmPassword, validateNewPassword } from "@/lib/validators";

type ResetPasswordField = "password" | "confirmPassword";

type ResetPasswordFieldErrors = Partial<Record<ResetPasswordField, string>>;

type UseResetPasswordValidationResult = {
  fieldErrors: ResetPasswordFieldErrors;
  validate: () => boolean;
  clearFieldError: (field: ResetPasswordField) => void;
};

export const useResetPasswordValidation = (
  password: string,
  confirmPassword: string,
): UseResetPasswordValidationResult => {
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordFieldErrors>({});

  const validate = () => {
    const errors: ResetPasswordFieldErrors = {
      password: validateNewPassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };
    setFieldErrors(errors);
    return !errors.password && !errors.confirmPassword;
  };

  const clearFieldError = (field: ResetPasswordField) =>
    setFieldErrors((prev) =>
      prev[field] ? { ...prev, [field]: undefined } : prev,
    );

  return { fieldErrors, validate, clearFieldError };
};
