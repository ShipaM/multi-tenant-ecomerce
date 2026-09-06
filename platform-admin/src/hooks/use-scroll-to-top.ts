import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router";

/**
 * <ScrollRestoration /> from react-router requires a data router and throws
 * in declarative mode (useScrollRestoration calls useDataRouterContext).
 * Minimal replacement: reset the scroll position on a pathname change.
 *
 * search and hash are ignored on purpose — those are filters and anchors,
 * and jumping to the top for them would be wrong.
 *
 * On POP (back/forward) the scroll is left alone: history.scrollRestoration
 * defaults to "auto", the browser restores the previous position itself, and
 * jumping to the top would break that restore.
 */
export function useScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") return;
    window.scrollTo(0, 0);
    // navigationType is deliberately out of the deps: the scroll resets on a
    // pathname change, and the navigation type is only a condition checked at
    // the moment of that change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}
