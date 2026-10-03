import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useResetPasswordSession } from "./useResetPasswordSession";

const navigate = vi.hoisted(() => vi.fn());

vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useNavigate: () => navigate,
}));

const renderWithState = (state: unknown) =>
  renderHook(() => useResetPasswordSession(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter
        initialEntries={[{ pathname: "/auth/reset-password", state }]}
        useTransitions={false}
      >
        {children}
      </MemoryRouter>
    ),
  });

describe("useResetPasswordSession", () => {
  beforeEach(() => {
    navigate.mockReset();
  });

  it("returns the email and reset token from the navigation state", () => {
    const { result } = renderWithState({
      email: "jane@example.com",
      resetToken: "tok",
    });

    expect(result.current).toEqual({
      email: "jane@example.com",
      resetToken: "tok",
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("returns the redirect target handed over by the login step", () => {
    const { result } = renderWithState({
      email: "jane@example.com",
      resetToken: "tok",
      redirectTo: "/orders",
    });

    expect(result.current.redirectTo).toBe("/orders");
  });

  it("sends the user back to forgot password when there is no state", () => {
    const { result } = renderWithState(null);

    expect(result.current).toEqual({ email: undefined, resetToken: undefined });
    expect(navigate).toHaveBeenCalledWith("/auth/forgot-password");
  });

  it("sends the user back when the reset token is missing", () => {
    renderWithState({ email: "jane@example.com" });

    expect(navigate).toHaveBeenCalledWith("/auth/forgot-password");
  });

  it("sends the user back when the email is missing", () => {
    renderWithState({ resetToken: "tok" });

    expect(navigate).toHaveBeenCalledWith("/auth/forgot-password");
  });
});
