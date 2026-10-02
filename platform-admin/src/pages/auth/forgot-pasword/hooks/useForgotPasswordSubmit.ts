import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { fetchForgotPassword } from "@/store/auth/thunks";

type UseForgotPasswordSubmitResult = {
  handleSubmit: (e: SubmitEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

/** Requests the reset code once `validate` passes, then moves to the OTP step; `onSuccess` runs after the request succeeded. */
export const useForgotPasswordSubmit = (
  email: string,
  validate: () => boolean,
  onSuccess?: () => void,
): UseForgotPasswordSubmitResult => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isLoading = useAppSelector(
    (state) => state.auth.isForgotPasswordLoading,
  );

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    try {
      const response = await dispatch(fetchForgotPassword({ email })).unwrap();

      if (response.success) {
        navigate("/auth/forgot-password/otp", {
          state: { email, createdAt: response.data.createdAt },
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

  return { handleSubmit, isLoading, error };
};
