import { Link, type LinkProps } from "react-router";

import { routeModules, type RouteModuleKey } from "@/routes/route-modules";

/**
 * The built-in `prefetch` prop of <Link> is dropped from the type on
 * purpose: it only works in framework mode (usePrefetchBehavior returns a
 * no-op without a FrameworkContext), so here it would silently do nothing.
 */
type PrefetchLinkProps = Omit<LinkProps, "prefetch"> & {
  /** Key of the routeModules entry to start loading on intent. */
  prefetchModule: RouteModuleKey;
};

/**
 * <Link> that loads the target route's chunk on hover or focus. By the time
 * the click lands the module is usually cached, so no Suspense fallback
 * flashes.
 */
export function PrefetchLink({
  prefetchModule,
  onMouseEnter,
  onFocus,
  ...props
}: PrefetchLinkProps) {
  const load = () => {
    void routeModules[prefetchModule]();
  };

  return (
    <Link
      {...props}
      // Do not swallow incoming handlers: Button asChild may pass its own
      // onFocus/onMouseEnter down here.
      onMouseEnter={(event) => {
        load();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        load();
        onFocus?.(event);
      }}
    />
  );
}
