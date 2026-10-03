import { act } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderHookWithDispatchOutcome } from "@/test/render-with-dispatch-outcome";
import { useLoginSubmit } from "./useLoginSubmit";

const navigate = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useNavigate: () => navigate,
}));

const credentials = { email: "jane@example.com", password: "secret" };

const submitEvent = () =>
  ({ preventDefault: vi.fn() }) as unknown as Parameters<
    ReturnType<typeof useLoginSubmit>["handleSubmit"]
  >[0];

describe("useLoginSubmit unexpected outcomes", () => {
  beforeEach(() => {
    navigate.mockReset();
    vi.mocked(toast.error).mockClear();
  });

  it("falls back to a generic message when the failure is not a string", async () => {
    const { result } = renderHookWithDispatchOutcome(
      () => useLoginSubmit(credentials, "/dashboard", () => true),
      { rejects: new Error("boom") },
    );

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.error).toBe("Failed to login");
    expect(toast.error).toHaveBeenCalledWith("Failed to login");
  });

  it("stays put when the response is neither a complete login nor a 2FA challenge", async () => {
    const { result } = renderHookWithDispatchOutcome(
      () => useLoginSubmit(credentials, "/dashboard", () => true),
      { resolves: {} },
    );

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });
});
