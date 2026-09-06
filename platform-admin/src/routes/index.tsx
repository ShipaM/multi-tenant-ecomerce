import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router";

import AuthLayout from "@/layouts/AuthLayout";
import { RootRedirect } from "@/routes/root-redirect";
import { routeModules } from "@/routes/route-modules";

// Code splitting: React.lazy + Suspense.
// In declarative mode the `lazy` prop on <Route> does nothing — it is only
// resolved by a data router (createBrowserRouter + RouterProvider).
//
// The import functions come from routeModules so that hover prefetching and
// lazy() itself point at one and the same module.
const LoginPage = lazy(routeModules.login);
const NotFoundPage = lazy(routeModules.notFound);

export default function AppRoutes() {
  return (
    <Routes>
      {/* Index route on "/" */}
      <Route index element={<RootRedirect />} />

      {/* Auth section. The layout route owns the /auth path segment, so its
          pages live under it: /auth/login, later /auth/forgot-password etc. */}
      <Route path="auth" element={<AuthLayout />}>
        {/* A bare /auth matches the layout route even without an index, and
            would render an empty shell. Send it to the canonical page. */}
        <Route index element={<Navigate to="login" replace />} />
        <Route path="login" element={<LoginPage />} />
      </Route>

      {/* Splat route: everything the routes above did not match */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
