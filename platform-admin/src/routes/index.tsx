import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router";

import AuthLayout from "@/layouts/AuthLayout";
import { RootRedirect } from "@/routes/root-redirect";
import { routeModules } from "@/routes/route-modules";

const LoginPage = lazy(routeModules.login);
const NotFoundPage = lazy(routeModules.notFound);
const ForgotPasswordPage = lazy(routeModules.forgotPassword);
const VerifyOtpPage = lazy(routeModules.verifyOtp);
const ResetPasswordPage = lazy(routeModules.resetPassword);

export const AppRoutes = () => {
  return (
    <Routes>
      <Route index element={<RootRedirect />} />

      <Route path="auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="login" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="forgot-password/otp" element={<VerifyOtpPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
