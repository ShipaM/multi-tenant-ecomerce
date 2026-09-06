/**
 * Explicit map of the lazy route modules.
 *
 * Two reasons to keep it separate:
 * 1. `lazy()` and the prefetch reference the very same import function, so
 *    prefetching on hover does not fire a second request — the ESM runtime
 *    caches the module and React.lazy gets it ready.
 * 2. Import paths stay literal and statically analysable: the bundler knows
 *    the exact set of chunks.
 */
export const routeModules = {
  login: () => import("@/pages/auth/LoginPage"),
  notFound: () => import("@/pages/errors/NotFoundPage"),
} as const;

export type RouteModuleKey = keyof typeof routeModules;
