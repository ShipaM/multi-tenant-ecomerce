import { act, renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import authReducer from "@/store/auth/authSlice";
import { useVerifyForgotOtpResend } from "./useVerifyForgotOtpResend";

const forgotPassword = vi.hoisted(() => vi.fn());

vi.mock("@/api/auth", () => ({ authApi: { forgotPassword } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const email = "jane@example.com";
const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000);

const freshCodeResponse = () => ({
  success: true,
  message: "OTP sent",
  data: { createdAt: new Date().toISOString() },
});

const setup = (createdAt: Date | string | null | undefined) => {
  const store = configureStore({ reducer: { auth: authReducer } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return renderHook(() => useVerifyForgotOtpResend(email, createdAt), {
    wrapper,
  });
};

describe("useVerifyForgotOtpResend", () => {
  beforeEach(() => {
    forgotPassword.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("counts down while the code is still valid", () => {
    const { result } = setup(minutesAgo(1));

    expect(result.current.isExpired).toBe(false);
    expect(result.current.formattedTime).toMatch(/^0[34]:\d{2}$/);
    expect(result.current.isResending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("is expired once the code is older than five minutes", () => {
    const { result } = setup(minutesAgo(6));

    expect(result.current.isExpired).toBe(true);
    expect(result.current.formattedTime).toBe("00:00");
  });

  it("is expired when the send time is unknown", () => {
    const { result } = setup(undefined);

    expect(result.current.isExpired).toBe(true);
  });

  it("requests a new code, restarts the countdown and shows the server message", async () => {
    forgotPassword.mockResolvedValue(freshCodeResponse());
    const { result } = setup(minutesAgo(6));

    await act(() => result.current.handleResend());

    expect(forgotPassword).toHaveBeenCalledWith({ email });
    expect(result.current.isExpired).toBe(false);
    expect(toast.success).toHaveBeenCalledWith("OTP sent");
    expect(result.current.error).toBeNull();
  });

  it("is resending while the request is in flight", async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    forgotPassword.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { result } = setup(minutesAgo(6));

    let resend: Promise<void> = Promise.resolve();
    act(() => {
      resend = result.current.handleResend();
    });
    expect(result.current.isResending).toBe(true);

    await act(async () => {
      resolveRequest(freshCodeResponse());
      await resend;
    });

    expect(result.current.isResending).toBe(false);
  });

  it("exposes the error, keeps the code expired and shows an error toast when the request fails", async () => {
    forgotPassword.mockRejectedValue(new Error("network down"));
    const { result } = setup(minutesAgo(6));

    await act(() => result.current.handleResend());

    expect(result.current.error).toBeTruthy();
    expect(toast.error).toHaveBeenCalledWith(result.current.error);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.isResending).toBe(false);
  });

  it("clears a previous error on the next attempt", async () => {
    forgotPassword.mockRejectedValueOnce(new Error("boom"));
    const { result } = setup(minutesAgo(6));
    await act(() => result.current.handleResend());
    expect(result.current.error).toBeTruthy();

    forgotPassword.mockResolvedValue(freshCodeResponse());
    await act(() => result.current.handleResend());

    expect(result.current.error).toBeNull();
  });
});
