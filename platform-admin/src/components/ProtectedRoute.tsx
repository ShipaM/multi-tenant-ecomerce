import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { buildLoginUrl } from "@/lib/redirect";
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
    return (
      <Navigate
        to={buildLoginUrl(`${location.pathname}${location.search}`)}
        replace
      />
    );
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return <Outlet />;
};
