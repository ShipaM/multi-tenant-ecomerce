import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { useRedirectState } from "./use-redirect-state";

const renderWithState = (state: unknown) =>
  renderHook(() => useRedirectState(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter
        initialEntries={[{ pathname: "/auth/forgot-password", state }]}
        useTransitions={false}
      >
        {children}
      </MemoryRouter>
    ),
  });

describe("useRedirectState", () => {
  it("returns the redirect target from the navigation state", () => {
    expect(renderWithState({ redirectTo: "/orders" }).result.current).toBe(
      "/orders",
    );
  });

  it("returns undefined when there is no state or no target", () => {
    expect(renderWithState(null).result.current).toBeUndefined();
    expect(renderWithState({ email: "a@b.co" }).result.current).toBeUndefined();
  });
});
