export const isSafeRedirectPath = (path: string): boolean =>
  path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
