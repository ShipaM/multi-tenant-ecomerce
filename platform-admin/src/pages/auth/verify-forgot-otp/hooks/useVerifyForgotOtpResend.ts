import { useState } from "react";
import { toast } from "sonner";
import { useOtpCountdown } from "@/hooks/useOtpCountdown";
import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { fetchForgotPassword } from "@/store/auth/thunks";

const OTP_EXPIRY_MINUTES = 5;

type UseVerifyForgotOtpResendResult = {
  formattedTime: string;
  isExpired: boolean;
  handleResend: () => Promise<void>;
  isResending: boolean;
  error: string | null;
};

/** Counts down the code's lifetime and requests a fresh code once it has expired. */
export const useVerifyForgotOtpResend = (
  email: string | undefined,
  initialCreatedAt: string | Date | null | undefined,
): UseVerifyForgotOtpResendResult => {
  const dispatch = useAppDispatch();

  const isResending = useAppSelector(
    (state) => state.auth.isForgotPasswordLoading,
  );

  const [createdAt, setCreatedAt] = useState<string | Date | null | undefined>(
    initialCreatedAt,
  );
  const [error, setError] = useState<string | null>(null);

  const { formattedTime, isExpired } = useOtpCountdown(
    createdAt,
    OTP_EXPIRY_MINUTES,
  );

  const handleResend = async () => {
    setError(null);

    try {
      const response = await dispatch(
        fetchForgotPassword({ email: email ?? "" }),
      ).unwrap();

      if (response.success) {
        setCreatedAt(response.data.createdAt);
        toast.success(response.message);
      }
    } catch (err) {
      const message = typeof err === "string" ? err : "Failed to send otp";
      setError(message);
      toast.error(message);
    }
  };

  return { formattedTime, isExpired, handleResend, isResending, error };
};
