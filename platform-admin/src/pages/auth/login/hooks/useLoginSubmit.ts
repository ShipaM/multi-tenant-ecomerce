import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { fetchLogin } from "@/store/auth/thunks";
import { isCompleteLoginResponse, isTwoFactorRequiredResponse } from "@/types";
import type { LoginCredentials } from "./useLoginCredentials";

type UseLoginSubmitResult = {
  handleSubmit: (e: SubmitEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

/** Submits credentials, then routes to the redirect target or to the 2FA step. */
export const useLoginSubmit = (
  credentials: LoginCredentials,
  redirectTo: string,
  validate: () => boolean,
): UseLoginSubmitResult => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isLoading = useAppSelector((state) => state.auth.isLoginLoading);

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    try {
      const response = await dispatch(fetchLogin(credentials)).unwrap();

      if (isCompleteLoginResponse(response)) {
        toast.success("Signed in successfully");
        navigate(redirectTo, { replace: true });
      } else if (isTwoFactorRequiredResponse(response)) {
        navigate("/auth/2fa", {
          state: {
            twoFactorToken: response.twoFactorToken,
            email: credentials.email,
            redirectTo,
          },
        });
      }
    } catch (err) {
      const message = typeof err === "string" ? err : "Failed to login";
      setError(message);
      toast.error(message);
    }
  };

  return { handleSubmit, isLoading, error };
};
