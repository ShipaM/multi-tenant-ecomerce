import { act } from "@testing-library/react";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import { renderHookWithDispatchOutcome } from "@/test/render-with-dispatch-outcome";
import { useVerifyForgotOtpSubmit } from "./useVerifyForgotOtpSubmit";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const submitEvent = () =>
  ({ preventDefault: vi.fn() }) as unknown as Parameters<
    ReturnType<typeof useVerifyForgotOtpSubmit>["handleSubmit"]
  >[0];

describe("useVerifyForgotOtpSubmit unexpected outcomes", () => {
  it("falls back to a generic message when the failure is not a string", async () => {
    const { result } = renderHookWithDispatchOutcome(
      () =>
        useVerifyForgotOtpSubmit({
          email: "jane@example.com",
          otp: "123456",
          redirectTo: undefined,
        }),
      { rejects: new Error("boom") },
    );

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.error).toBe("Failed to send otp");
    expect(toast.error).toHaveBeenCalledWith("Failed to send otp");
  });

  it("sends an empty email when the session has none", async () => {
    const { result } = renderHookWithDispatchOutcome(
      () =>
        useVerifyForgotOtpSubmit({
          email: undefined,
          otp: "123456",
          redirectTo: undefined,
        }),
      { resolves: { success: false } },
    );

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.error).toBeNull();
  });
});
