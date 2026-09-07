import { Navigate } from "react-router";

export function RootRedirect() {
  return <Navigate to="/auth/login" replace />;
}
