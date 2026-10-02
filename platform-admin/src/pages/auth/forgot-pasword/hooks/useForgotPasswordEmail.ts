import { useState, type ChangeEvent } from "react";

type UseForgotPasswordEmailResult = {
  email: string;
  onEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
  resetEmail: () => void;
};

export const useForgotPasswordEmail = (): UseForgotPasswordEmailResult => {
  const [email, setEmail] = useState<string>("");

  return {
    email,
    onEmailChange: (e) => setEmail(e.target.value),
    resetEmail: () => setEmail(""),
  };
};
