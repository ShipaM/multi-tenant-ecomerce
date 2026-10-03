import { useLocation } from "react-router";
import type { AuthNavigationState } from "@/types";

/** The page to return to after sign-in, handed over through `location.state` by the previous auth step. */
export const useRedirectState = (): string | undefined =>
  (useLocation().state as AuthNavigationState | null)?.redirectTo;
