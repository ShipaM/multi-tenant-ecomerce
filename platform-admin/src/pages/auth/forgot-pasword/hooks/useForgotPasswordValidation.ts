import { useState } from "react";
import { validateEmail } from "@/lib/validators";

type UseForgotPasswordValidationResult = {
  emailError: string | undefined;
  validate: () => boolean;
  clearEmailError: () => void;
};

export const useForgotPasswordValidation = (
  email: string,
): UseForgotPasswordValidationResult => {
  const [emailError, setEmailError] = useState<string | undefined>();

  const validate = () => {
    const error = validateEmail(email);
    setEmailError(error);
    return !error;
  };

  return {
    emailError,
    validate,
    clearEmailError: () => setEmailError(undefined),
  };
};
