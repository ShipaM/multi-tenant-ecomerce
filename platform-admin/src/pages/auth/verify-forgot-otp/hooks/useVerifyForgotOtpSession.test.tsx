import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useVerifyForgotOtpSession } from "./useVerifyForgotOtpSession";

const navigate = vi.hoisted(() => vi.fn());

vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useNavigate: () => navigate,
}));

const renderWithState = (state: unknown) =>
  renderHook(() => useVerifyForgotOtpSession(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter
        initialEntries={[{ pathname: "/auth/forgot-password/otp", state }]}
        useTransitions={false}
      >
        {children}
      </MemoryRouter>
    ),
  });

describe("useVerifyForgotOtpSession", () => {
  beforeEach(() => {
    navigate.mockReset();
  });

  it("returns the email, send time and return path from the navigation state", () => {
    const { result } = renderWithState({
      email: "jane@example.com",
      createdAt: "2026-10-02T10:00:00.000Z",
      redirectTo: "/orders",
    });

    expect(result.current).toEqual({
      email: "jane@example.com",
      createdAt: "2026-10-02T10:00:00.000Z",
      redirectTo: "/orders",
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("sends the user back to forgot password when there is no state", () => {
    const { result } = renderWithState(null);

    expect(result.current.email).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith("/auth/forgot-password");
  });

  it("sends the user back when the email is missing", () => {
    renderWithState({ createdAt: "2026-10-02T10:00:00.000Z" });

    expect(navigate).toHaveBeenCalledWith("/auth/forgot-password");
  });
});
