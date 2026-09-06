import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import App from "@/App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* basename from BASE_URL — the app survives a deploy into a subfolder.

        useTransitions={false}: by default BrowserRouter wraps a location
        change in React.startTransition, and during a transition React
        deliberately does NOT show Suspense fallbacks — it keeps the old
        screen while the chunk loads. Our <Suspense> around <Outlet /> would
        then never fire on a link click, and the navigation would look like
        a freeze. */}
    <BrowserRouter basename={import.meta.env.BASE_URL} useTransitions={false}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
