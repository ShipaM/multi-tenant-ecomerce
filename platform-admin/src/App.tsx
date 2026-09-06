import { Suspense } from "react";

import { RouteErrorBoundary } from "@/components/route-error-boundary";
import { RouteFallback } from "@/components/route-fallback";
import { ScrollToTop } from "@/components/scroll-to-top";
import AppRoutes from "@/routes";

function App() {
  return (
    <RouteErrorBoundary>
      <ScrollToTop />
      {/* Outer Suspense — a safety net for lazy routes that live outside the
          layouts (404, for one). Layouts have their own Suspense around
          <Outlet />. */}
      <Suspense fallback={<RouteFallback fullscreen />}>
        <main>
          <AppRoutes />
        </main>
      </Suspense>
    </RouteErrorBoundary>
  );
}

export default App;
