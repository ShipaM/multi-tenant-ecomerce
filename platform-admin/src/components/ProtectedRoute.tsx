import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { fetchMe } from "@/store/auth/authSlice";
import { useEffect } from "react";
import { Navigate, Outlet } from "react-router";

export const ProtectedRoute = () => {
  const dispatch = useAppDispatch();
  const { accessToken, status, user } = useAppSelector((state) => state.auth);

  const hasToken = Boolean(accessToken);

  useEffect(() => {
    if (hasToken) {
      dispatch(fetchMe());
    }
  }, [dispatch, hasToken]);

  if (!hasToken || status === "failed") {
    return <Navigate to="/auth/login" replace />;
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return <Outlet />;
};
