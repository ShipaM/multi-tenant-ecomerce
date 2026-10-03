import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { verify2FaLoginOtp } from "@/store/auth/thunks";
import { isCompleteLoginResponse, isTwoFactorRequiredResponse } from "@/types";

type UseVerify2FaSubmitParams = {
  otp: string;
  email: string | undefined;
  twoFactorToken: string | undefined;
  redirectTo: string;
};

type UseVerify2FaSubmitResult = {
  handleSubmit: (e: SubmitEvent<HTMLFormElement>) => Promise<void>;
  isVerifying: boolean;
  error: string | null;
};

/** Verifies the 2FA code, then enters the app, or moves on to another 2FA step when the server asks for one. */
export const useVerify2FaSubmit = ({
  otp,
  email,
  twoFactorToken,
  redirectTo,
}: UseVerify2FaSubmitParams): UseVerify2FaSubmitResult => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isVerifying = useAppSelector(
    (state) => state.auth.isVerify2FaLoginOtpLoading,
  );

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await dispatch(
        verify2FaLoginOtp({ twoFactorToken: twoFactorToken ?? "", otp }),
      ).unwrap();

      if (isCompleteLoginResponse(response)) {
        navigate(redirectTo, { replace: true });
      } else if (isTwoFactorRequiredResponse(response)) {
        navigate("/auth/2fa", {
          state: {
            twoFactorToken: response.twoFactorToken,
            email,
            redirectTo,
          },
        });
      }
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to verify otp");
    }
  };

  return { handleSubmit, isVerifying, error };
};
