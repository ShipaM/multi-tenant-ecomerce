import { act } from "@testing-library/react";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import { renderHookWithDispatchOutcome } from "@/test/render-with-dispatch-outcome";
import { useForgotPasswordSubmit } from "./useForgotPasswordSubmit";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const submitEvent = () =>
  ({ preventDefault: vi.fn() }) as unknown as Parameters<
    ReturnType<typeof useForgotPasswordSubmit>["handleSubmit"]
  >[0];

describe("useForgotPasswordSubmit unexpected outcomes", () => {
  it("falls back to a generic message when the failure is not a string", async () => {
    const { result } = renderHookWithDispatchOutcome(
      () => useForgotPasswordSubmit("jane@example.com", () => true),
      { rejects: new Error("boom") },
    );

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.error).toBe("Failed to send otp");
    expect(toast.error).toHaveBeenCalledWith("Failed to send otp");
  });
});
