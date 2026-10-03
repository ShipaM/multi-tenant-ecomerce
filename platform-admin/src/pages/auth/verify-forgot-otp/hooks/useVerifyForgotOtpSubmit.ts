import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { fetchForgotPasswordOtpVerify } from "@/store/auth/thunks";

type UseVerifyForgotOtpSubmitParams = {
  email: string | undefined;
  otp: string;
  redirectTo: string | undefined;
  /** Runs after the code was accepted, e.g. to clear the field. */
  onSuccess?: () => void;
};

type UseVerifyForgotOtpSubmitResult = {
  handleSubmit: (e: SubmitEvent<HTMLFormElement>) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
};

/** Verifies the code and moves on to the reset password step with the token the server returns. */
export const useVerifyForgotOtpSubmit = ({
  email,
  otp,
  redirectTo,
  onSuccess,
}: UseVerifyForgotOtpSubmitParams): UseVerifyForgotOtpSubmitResult => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isSubmitting = useAppSelector(
    (state) => state.auth.isForgotPasswordOtpVerifyLoading,
  );

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await dispatch(
        fetchForgotPasswordOtpVerify({ email: email ?? "", otp }),
      ).unwrap();

      if (response.success) {
        navigate("/auth/reset-password", {
          state: { email, resetToken: response.data.resetToken, redirectTo },
          replace: true,
        });
        onSuccess?.();
        toast.success(response.message);
      }
    } catch (err) {
      const message = typeof err === "string" ? err : "Failed to send otp";
      setError(message);
      toast.error(message);
    }
  };

  return { handleSubmit, isSubmitting, error };
};
