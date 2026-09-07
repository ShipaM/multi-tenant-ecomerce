import { Link, type LinkProps } from "react-router";

import { routeModules, type RouteModuleKey } from "@/routes/route-modules";
import type { FC } from "react";

type PrefetchLinkProps = Omit<LinkProps, "prefetch"> & {
  prefetchModule: RouteModuleKey;
};

export const PrefetchLink: FC<PrefetchLinkProps> = ({
  prefetchModule,
  onMouseEnter,
  onFocus,
  ...props
}) => {
  const load = () => {
    void routeModules[prefetchModule]();
  };

  return (
    <Link
      {...props}
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
};
