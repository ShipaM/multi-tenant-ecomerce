export const routeModules = {
  login: () => import("@/pages/auth/LoginPage"),
  notFound: () => import("@/pages/errors/NotFoundPage"),
  forgotPassword: () => import("@/pages/auth/ForgotPasswordPage"),
  verifyOtp: () => import("@/pages/auth/VerifyOtpPage"),
  resetPassword: () => import("@/pages/auth/ResetPasswordPage"),
  dashboard: () => import("@/pages/dashboard/DashboardPage"),
  sellers: () => import("@/pages/dashboard/sellers/SellersPage"),
  commisionPayouts: () =>
    import("@/pages/dashboard/commision-payouts/CommisionPayoutsPage"),
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
