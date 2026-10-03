export const DEFAULT_REDIRECT = "/dashboard";

export const isSafeRedirectPath = (path: string): boolean =>
  path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");

/** Builds the login URL, carrying the page to return to after sign-in when it is a safe in-app path other than the default. */
export const buildLoginUrl = (redirectTo?: string): string =>
  redirectTo &&
  redirectTo !== DEFAULT_REDIRECT &&
  isSafeRedirectPath(redirectTo)
    ? `/auth/login?redirect_uri=${encodeURIComponent(redirectTo)}`
    : "/auth/login";
