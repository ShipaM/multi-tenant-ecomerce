import { Suspense } from "react";
import { Outlet } from "react-router";
import PlatfromLogo from "@/assets/platform-logo.png";

import { RouteFallback } from "@/components/route-fallback";

/**
 * Layout route for the /auth section: renders the branding panel and hosts
 * the auth pages in its <Outlet />.
 */
const AuthLayout = () => {
  return (
    <div className="flex min-h-svh">
      <div className="hidden lg:flex flex-col justify-between bg-linear-to-br from-[#06251A] to-[#10543A] p-12 lg:w-110 xl:w-125">
        <div className="flex items-center gap-3">
          <img
            src={PlatfromLogo}
            alt="Platform Admin Logo"
            className="size-12 roundd-xl shadow-lg shadow-black/20"
          />
          <span className="text-base font-bold text-white">Platform Admin</span>
        </div>

        <div>
          <h1 className="max-w-95 text-2xl leading-snug font-bold text-white">
            Run every store on your marketplace from one place.
          </h1>
          <p className="mt-3.5 max-w-90 text-sm leading-5 text-[#c7dccb]">
            Tenants, catalog, commissions, delivery network and reporting —
            unified across every store on the platform.
          </p>
        </div>

        <p className="text-xs text-[#8fb093]">
          &copy; 2026 Dynamic Coding with Amit
        </p>
      </div>
      {/* Suspense inside the layout: the page chunk loads while the layout
          shell stays on screen. */}
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </div>
  );
};

export default AuthLayout;
