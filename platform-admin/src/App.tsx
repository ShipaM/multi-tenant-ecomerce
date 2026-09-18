import { Suspense } from "react";

import { RouteErrorBoundary, RouteFallback, ScrollToTop } from "@/components";
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
