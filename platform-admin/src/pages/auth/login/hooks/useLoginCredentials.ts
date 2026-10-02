import { useState, type ChangeEvent } from "react";

export type LoginCredentials = {
  email: string;
  password: string;
};

type UseLoginCredentialsResult = {
  credentials: LoginCredentials;
  onEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

/** Holds the controlled form state for the email and password fields. */
export const useLoginCredentials = (): UseLoginCredentialsResult => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  return {
    credentials: { email, password },
    onEmailChange: (e) => setEmail(e.target.value),
    onPasswordChange: (e) => setPassword(e.target.value),
  };
};
