export const routeModules = {
  login: () => import("@/pages/auth/LoginPage"),
  notFound: () => import("@/pages/errors/NotFoundPage"),
  forgotPassword: () => import("@/pages/auth/ForgotPasswordPage"),
  verifyOtp: () => import("@/pages/auth/VerifyOtpPage"),
  resetPassword: () => import("@/pages/auth/ResetPasswordPage"),
  dashboard: () => import("@/pages/dashboard/DashboardPage"),
} as const;

export type RouteModuleKey = keyof typeof routeModules;
