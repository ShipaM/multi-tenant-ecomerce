import { Suspense, useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import PlatformLogo from "@/assets/platform-logo.png";

import { RouteFallback } from "@/components/route-fallback";
import { useAppSelector } from "@/hooks/use-store";

const AuthLayout = () => {
  const user = useAppSelector((state) => state?.auth);

  const navigate = useNavigate();

  useEffect(() => {
    if (user.accessToken) {
      navigate("/dashboard");
    }
  }, [user.accessToken, navigate]);

  return (
    <div className="flex min-h-svh">
      <div className="hidden lg:flex flex-col justify-between bg-linear-to-br from-[#06251A] to-[#10543A] p-12 lg:w-110 xl:w-125">
        <div className="flex items-center gap-3">
          <img
            src={PlatformLogo}
            alt="Platform Admin Logo"
            className="size-12 rounded-xl shadow-lg shadow-black/20"
          />
          <span className="text-base font-bold text-white">Platform Admin</span>
        </div>

        <div>
          <p className="max-w-95 text-2xl leading-snug font-bold text-white">
            Run every store on your marketplace from one place.
          </p>
          <p className="mt-3.5 max-w-90 text-sm leading-5 text-[#c7dccb]">
            Tenants, catalog, commissions, delivery network and reporting —
            unified across every store on the platform.
          </p>
        </div>

        <p className="text-xs text-[#8fb093]">
          &copy; 2026 Dynamic Coding with Amit
        </p>
      </div>
      <main className="flex flex-1 items-center justify-center bg-background p-8">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

export default AuthLayout;
