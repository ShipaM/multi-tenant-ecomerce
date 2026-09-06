import { Navigate } from "react-router";

/**
 * Entry point for "/" and the future seam for the auth check: a signed-in
 * user will be sent to the dashboard from here, a guest to the login page.
 * Until the dashboard exists, always go to /auth/login.
 */
export function RootRedirect() {
  return <Navigate to="/auth/login" replace />;
}
