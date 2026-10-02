import { useSearchParams } from "react-router";
import { isSafeRedirectPath } from "@/lib/redirect";

const DEFAULT_REDIRECT = "/dashboard";

/** Resolves the post-login path from `redirect_uri`, falling back to the dashboard if it is missing or unsafe. */
export const useRedirectTarget = (): string => {
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect_uri");

  return redirectParam && isSafeRedirectPath(redirectParam)
    ? redirectParam
    : DEFAULT_REDIRECT;
};
