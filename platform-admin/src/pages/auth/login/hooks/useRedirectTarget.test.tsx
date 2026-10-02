import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { useRedirectTarget } from "./useRedirectTarget";

const renderAt = (url: string) =>
  renderHook(() => useRedirectTarget(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[url]} useTransitions={false}>
        {children}
      </MemoryRouter>
    ),
  }).result.current;

describe("useRedirectTarget", () => {
  it("falls back to the dashboard when there is no redirect_uri", () => {
    expect(renderAt("/auth/login")).toBe("/dashboard");
  });

  it("returns a safe redirect_uri", () => {
    expect(renderAt("/auth/login?redirect_uri=/orders")).toBe("/orders");
  });

  it.each(["//evil.com", "https://evil.com", "/\\evil.com", "orders"])(
    "falls back to the dashboard for the unsafe path %s",
    (path) => {
      expect(
        renderAt(`/auth/login?redirect_uri=${encodeURIComponent(path)}`),
      ).toBe("/dashboard");
    },
  );
});
