import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { isSafeRedirectPath } from "@/lib/redirect";
import type { AuthNavigationState } from "@/types";

type UseVerify2FaSessionResult = {
  email: string | undefined;
  twoFactorToken: string | undefined;
  redirectTo: string;
};

/** Reads the email, 2FA token and a safe redirect target from the login step, and sends the user back to login if the token is missing. */
export const useVerify2FaSession = (): UseVerify2FaSessionResult => {
  const location = useLocation();
  const navigate = useNavigate();

  const navState = location.state as AuthNavigationState | null;
  const email = navState?.email;
  const twoFactorToken = navState?.twoFactorToken;
  const redirectTo =
    navState?.redirectTo && isSafeRedirectPath(navState.redirectTo)
      ? navState.redirectTo
      : "/dashboard";

  useEffect(() => {
    if (!twoFactorToken) navigate("/auth/login");
  }, [twoFactorToken, navigate]);

  return { email, twoFactorToken, redirectTo };
};
