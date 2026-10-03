import { act } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderHookWithDispatchOutcome } from "@/test/render-with-dispatch-outcome";
import { useVerifyForgotOtpResend } from "./useVerifyForgotOtpResend";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("useVerifyForgotOtpResend unexpected outcomes", () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("falls back to a generic message when the failure is not a string", async () => {
    const { result } = renderHookWithDispatchOutcome(
      () => useVerifyForgotOtpResend("jane@example.com", undefined),
      { rejects: new Error("boom") },
    );

    await act(() => result.current.handleResend());

    expect(result.current.error).toBe("Failed to send otp");
    expect(toast.error).toHaveBeenCalledWith("Failed to send otp");
  });

  it("keeps the code expired and says nothing when the response is not a success", async () => {
    const { result } = renderHookWithDispatchOutcome(
      () => useVerifyForgotOtpResend(undefined, undefined),
      { resolves: { success: false } },
    );

    await act(() => result.current.handleResend());

    expect(result.current.isExpired).toBe(true);
    expect(toast.success).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });
});
