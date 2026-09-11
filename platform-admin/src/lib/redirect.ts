// Only allow same-origin, relative paths as a post-login redirect target.
// Rejects absolute URLs and protocol-relative ones (//evil.com, /\evil.com)
// so a crafted ?redirectTo= query param can't send the user off-site.
export const isSafeRedirectPath = (path: string): boolean =>
  path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
