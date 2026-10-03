import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useVerify2FaSession } from "./useVerify2FaSession";

const navigate = vi.hoisted(() => vi.fn());

vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useNavigate: () => navigate,
}));

const renderWithState = (state: unknown) =>
  renderHook(() => useVerify2FaSession(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter
        initialEntries={[{ pathname: "/auth/2fa", state }]}
        useTransitions={false}
      >
        {children}
      </MemoryRouter>
    ),
  });

describe("useVerify2FaSession", () => {
  beforeEach(() => {
    navigate.mockReset();
  });

  it("returns the email, token and redirect target from the navigation state", () => {
    const { result } = renderWithState({
      email: "jane@example.com",
      twoFactorToken: "2fa-tok",
      redirectTo: "/orders",
    });

    expect(result.current).toEqual({
      email: "jane@example.com",
      twoFactorToken: "2fa-tok",
      redirectTo: "/orders",
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("defaults the redirect target to the dashboard", () => {
    const { result } = renderWithState({ twoFactorToken: "2fa-tok" });

    expect(result.current.redirectTo).toBe("/dashboard");
  });

  it("ignores an unsafe redirect target", () => {
    const { result } = renderWithState({
      twoFactorToken: "2fa-tok",
      redirectTo: "https://evil.example.com",
    });

    expect(result.current.redirectTo).toBe("/dashboard");
  });

  it("sends the user back to login when there is no state", () => {
    const { result } = renderWithState(null);

    expect(result.current.twoFactorToken).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith("/auth/login");
  });

  it("sends the user back to login when the token is missing", () => {
    renderWithState({ email: "jane@example.com" });

    expect(navigate).toHaveBeenCalledWith("/auth/login");
  });
});
