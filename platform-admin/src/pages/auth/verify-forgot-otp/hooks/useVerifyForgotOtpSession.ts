import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import type { AuthNavigationState } from "@/types";

type VerifyForgotOtpNavigationState = AuthNavigationState & {
  createdAt?: string | Date | null;
};

type UseVerifyForgotOtpSessionResult = {
  email: string | undefined;
  /** When the code was sent, as handed over by the forgot password step. */
  createdAt: string | Date | null | undefined;
  redirectTo: string | undefined;
};

/** Reads the email, the code's send time and the return path from the forgot password step, and sends the user back if the email is missing. */
export const useVerifyForgotOtpSession =
  (): UseVerifyForgotOtpSessionResult => {
    const location = useLocation();
    const navigate = useNavigate();

    const navState = location.state as VerifyForgotOtpNavigationState | null;
    const email = navState?.email;
    const createdAt = navState?.createdAt;
    const redirectTo = navState?.redirectTo;

    useEffect(() => {
      if (!email) navigate("/auth/forgot-password");
    }, [email, navigate]);

    return { email, createdAt, redirectTo };
  };
