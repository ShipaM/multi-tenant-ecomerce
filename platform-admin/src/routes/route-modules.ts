export const routeModules = {
  login: () => import("@/pages/auth/login/LoginPage"),
  notFound: () => import("@/pages/errors/NotFoundPage"),
  forgotPassword: () =>
    import("@/pages/auth/forgot-pasword/ForgotPasswordPage"),
  verifyOtp: () => import("@/pages/auth/VerifyForgotOtpPage"),
  verify2Fa: () => import("@/pages/auth/Verify2FaOtpPage"),
  resetPassword: () => import("@/pages/auth/reset-password/ResetPasswordPage"),
  dashboard: () => import("@/pages/dashboard/DashboardPage"),
  sellers: () => import("@/pages/dashboard/sellers/SellersPage"),
  commissionPayouts: () =>
    import("@/pages/dashboard/commission-payouts/CommissionPayoutsPage"),
  globalCatalog: () =>
    import("@/pages/dashboard/global-catalog/GlobalCatalogPage"),
  deliveryNetwork: () =>
    import("@/pages/dashboard/delivery-network/DeliveryNetworkPage"),
  customers: () => import("@/pages/dashboard/customers/CustomersPage"),
  orders: () => import("@/pages/dashboard/orders/OrdersPage"),
  support: () => import("@/pages/dashboard/support/SupportPage"),
  marketing: () => import("@/pages/dashboard/marketing/MarketingPage"),
  reports: () => import("@/pages/dashboard/reports/ReportsPage"),
  usersPermissions: () =>
    import("@/pages/dashboard/users-permissions/UsersPermissionsPage"),
  settings: () => import("@/pages/dashboard/settings/SettingsPage"),
  profile: () => import("@/pages/dashboard/account/ProfileDetailsPage"),
} as const;

export type RouteModuleKey = keyof typeof routeModules;
