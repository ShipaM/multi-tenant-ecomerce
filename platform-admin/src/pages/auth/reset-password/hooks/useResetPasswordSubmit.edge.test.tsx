import { act } from "@testing-library/react";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import { renderHookWithDispatchOutcome } from "@/test/render-with-dispatch-outcome";
import { useResetPasswordSubmit } from "./useResetPasswordSubmit";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const submitEvent = () =>
  ({ preventDefault: vi.fn() }) as unknown as Parameters<
    ReturnType<typeof useResetPasswordSubmit>["handleSubmit"]
  >[0];

describe("useResetPasswordSubmit unexpected outcomes", () => {
  it("falls back to a generic message when the failure is not a string", async () => {
    const { result } = renderHookWithDispatchOutcome(
      () =>
        useResetPasswordSubmit({
          password: "new-password-1",
          resetToken: "tok",
          validate: () => true,
        }),
      { rejects: new Error("boom") },
    );

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.error).toBe("Failed to reset password");
    expect(toast.error).toHaveBeenCalledWith("Failed to reset password");
  });
});
