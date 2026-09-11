import { Suspense } from "react";

import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { RouteFallback } from "@/components/route-fallback";
import { ScrollToTop } from "@/components/ScrollToTop";
import AppRoutes from "@/routes";

function App() {
  return (
    <RouteErrorBoundary>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback fullscreen />}>
        <AppRoutes />
      </Suspense>
    </RouteErrorBoundary>
  );
}

export default App;
