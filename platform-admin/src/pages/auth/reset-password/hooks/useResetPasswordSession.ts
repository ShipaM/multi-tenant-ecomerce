import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import type { AuthNavigationState } from "@/types";

type UseResetPasswordSessionResult = {
  email: string | undefined;
  resetToken: string | undefined;
  redirectTo: string | undefined;
};

/** Reads the email and reset token handed over by the OTP step, and sends the user back if they are missing. */
export const useResetPasswordSession = (): UseResetPasswordSessionResult => {
  const location = useLocation();
  const navigate = useNavigate();

  const navState = location.state as AuthNavigationState | null;
  const email = navState?.email;
  const resetToken = navState?.resetToken;
  const redirectTo = navState?.redirectTo;

  useEffect(() => {
    if (!email || !resetToken) navigate("/auth/forgot-password");
  }, [email, resetToken, navigate]);

  return { email, resetToken, redirectTo };
};
