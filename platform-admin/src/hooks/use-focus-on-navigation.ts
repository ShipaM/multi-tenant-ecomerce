import { useEffect, useRef, type RefObject } from "react";
import { useLocation } from "react-router";

/**
 * Moves focus to the element after every client-side navigation, so keyboard and screen reader users
 * land on the new page instead of staying on the link they activated. The first render is left alone.
 */
export const useFocusOnNavigation = <
  T extends HTMLElement,
>(): RefObject<T | null> => {
  const ref = useRef<T | null>(null);
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;

    previousPathname.current = pathname;
    ref.current?.focus();
  }, [pathname]);

  return ref;
};
