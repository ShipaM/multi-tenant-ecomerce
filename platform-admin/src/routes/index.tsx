import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router";

import AuthLayout from "@/layouts/AuthLayout";
import { RootRedirect } from "@/routes/root-redirect";
import { routeModules } from "@/routes/route-modules";
import DashboardLayout from "@/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const LoginPage = lazy(routeModules.login);
const NotFoundPage = lazy(routeModules.notFound);
const ForgotPasswordPage = lazy(routeModules.forgotPassword);
const VerifyOtpPage = lazy(routeModules.verifyOtp);
const ResetPasswordPage = lazy(routeModules.resetPassword);
const DashboardPage = lazy(routeModules.dashboard);
const SellersPage = lazy(routeModules.sellers);
const CommisionPayoutsPage = lazy(routeModules.commisionPayouts);
const GlobalCatalogPage = lazy(routeModules.globalCatalog);
const DeliveryNetworkPage = lazy(routeModules.deliveryNetwork);
const CustomersPage = lazy(routeModules.customers);
const OrdersPage = lazy(routeModules.orders);
const SupportPage = lazy(routeModules.support);
const MarketingPage = lazy(routeModules.marketing);
const ReportsPage = lazy(routeModules.reports);
const UsersPermissionsPage = lazy(routeModules.usersPermissions);
const SettingsPage = lazy(routeModules.settings);

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

      <Route element={<ProtectedRoute />}>
        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="sellers" element={<SellersPage />} />
          <Route path="commision-payouts" element={<CommisionPayoutsPage />} />
          <Route path="global-catalog" element={<GlobalCatalogPage />} />
          <Route path="delivery-network" element={<DeliveryNetworkPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="marketing" element={<MarketingPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route
            path="users-permissions"
            element={<UsersPermissionsPage />}
          />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
