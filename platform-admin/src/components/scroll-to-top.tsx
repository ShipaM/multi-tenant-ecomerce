import { useScrollToTop } from "@/hooks/use-scroll-to-top";

/**
 * Renders nothing — it only holds the subscription to location changes.
 * It sits next to <Routes> rather than inside the layouts: that way the
 * scroll reset also covers routes without a layout (404), and a new layout
 * does not have to remember about it.
 */
export function ScrollToTop() {
  useScrollToTop();
  return null;
}
