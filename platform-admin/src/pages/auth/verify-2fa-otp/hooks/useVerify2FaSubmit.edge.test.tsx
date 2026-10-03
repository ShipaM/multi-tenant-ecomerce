import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderHookWithDispatchOutcome } from "@/test/render-with-dispatch-outcome";
import { useVerify2FaSubmit } from "./useVerify2FaSubmit";

const navigate = vi.hoisted(() => vi.fn());

vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useNavigate: () => navigate,
}));

const params = {
  otp: "123456",
  email: "jane@example.com",
  twoFactorToken: "2fa-tok",
  redirectTo: "/dashboard",
};

const submitEvent = () =>
  ({ preventDefault: vi.fn() }) as unknown as Parameters<
    ReturnType<typeof useVerify2FaSubmit>["handleSubmit"]
  >[0];

describe("useVerify2FaSubmit unexpected outcomes", () => {
  beforeEach(() => {
    navigate.mockReset();
  });

  it("falls back to a generic message when the failure is not a string", async () => {
    const { result } = renderHookWithDispatchOutcome(
      () => useVerify2FaSubmit(params),
      { rejects: new Error("boom") },
    );

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.error).toBe("Failed to verify otp");
  });

  it("stays put when the response is neither a complete login nor another 2FA challenge", async () => {
    const { result } = renderHookWithDispatchOutcome(
      () => useVerify2FaSubmit(params),
      { resolves: {} },
    );

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });
});
