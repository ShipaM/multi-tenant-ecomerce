import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { resetForgottenPassword } from "@/store/auth/thunks";

type UseResetPasswordSubmitParams = {
  password: string;
  resetToken: string | undefined;
  /** Returns true when the form fields are valid; sets the field errors otherwise. */
  validate: () => boolean;
  /** Runs after the password was reset, e.g. to clear the form. */
  onSuccess?: () => void;
};

type UseResetPasswordSubmitResult = {
  handleSubmit: (e: SubmitEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
  isDone: boolean;
  error: string | null;
};

/** Resets the password with the token from the OTP step, after the fields validate and the session is alive. */
export const useResetPasswordSubmit = ({
  password,
  resetToken,
  validate,
  onSuccess,
}: UseResetPasswordSubmitParams): UseResetPasswordSubmitResult => {
  const dispatch = useAppDispatch();

  const isLoading = useAppSelector(
    (state) => state.auth.isResetPasswordLoading,
  );

  const [isDone, setIsDone] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) return;

    if (!resetToken) {
      setError("Session will be expired. Please try again.");
      return;
    }

    setError(null);

    try {
      const response = await dispatch(
        resetForgottenPassword({ password, resetToken }),
      ).unwrap();

      if (response.success) {
        setIsDone(true);
        onSuccess?.();
        toast.success(response.message || "Password reset successfully");
      }
    } catch (err) {
      const message =
        typeof err === "string" ? err : "Failed to reset password";
      setError(message);
      toast.error(message);
    }
  };

  return { handleSubmit, isLoading, isDone, error };
};
