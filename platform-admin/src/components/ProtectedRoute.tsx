import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { fetchMe } from "@/store/auth/thunks";
import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";

export const ProtectedRoute = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const user = useAppSelector((state) => state.auth.user);

  const hasToken = Boolean(accessToken);

  useEffect(() => {
    if (hasToken) {
      dispatch(fetchMe());
    }
  }, [dispatch, hasToken]);

  if (!hasToken) {
    const redirectTarget = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/auth/login?redirect_uri=${encodeURIComponent(redirectTarget)}`}
        replace
      />
    );
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return <Outlet />;
};
