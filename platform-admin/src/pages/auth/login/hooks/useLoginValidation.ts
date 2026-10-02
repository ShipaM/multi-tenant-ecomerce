import { useState } from "react";
import { validateLogin, type LoginFieldErrors } from "../validateLogin";
import type { LoginCredentials } from "./useLoginCredentials";

type UseLoginValidationResult = {
  fieldErrors: LoginFieldErrors;
  /** Validates all fields, stores the errors and returns whether the form is valid. */
  validate: () => boolean;
  clearFieldError: (field: keyof LoginCredentials) => void;
};

/** Owns the per-field error messages; validation runs on submit and an error clears when its field is edited. */
export const useLoginValidation = (
  credentials: LoginCredentials,
): UseLoginValidationResult => {
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

  const validate = () => {
    const errors = validateLogin(credentials);
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (field: keyof LoginCredentials) =>
    setFieldErrors((prev) =>
      prev[field] ? { ...prev, [field]: undefined } : prev,
    );

  return { fieldErrors, validate, clearFieldError };
};
