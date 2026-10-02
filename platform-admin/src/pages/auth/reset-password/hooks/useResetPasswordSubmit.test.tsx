import { act, renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import authReducer from "@/store/auth/authSlice";
import { useResetPasswordSubmit } from "./useResetPasswordSubmit";

const resetForgottenPassword = vi.hoisted(() => vi.fn());

vi.mock("@/api/auth", () => ({ authApi: { resetForgottenPassword } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type Params = Parameters<typeof useResetPasswordSubmit>[0];

const baseParams: Params = {
  password: "new-password",
  resetToken: "tok",
  validate: () => true,
};

const submitEvent = () =>
  ({ preventDefault: vi.fn() }) as unknown as Parameters<
    ReturnType<typeof useResetPasswordSubmit>["handleSubmit"]
  >[0];

const setup = (overrides: Partial<Params> = {}) => {
  const store = configureStore({ reducer: { auth: authReducer } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return renderHook(
    () => useResetPasswordSubmit({ ...baseParams, ...overrides }),
    {
      wrapper,
    },
  );
};

describe("useResetPasswordSubmit", () => {
  beforeEach(() => {
    resetForgottenPassword.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("starts idle with no error", () => {
    const { result } = setup();

    expect(result.current).toMatchObject({
      isLoading: false,
      isDone: false,
      error: null,
    });
  });

  it("prevents the default form submission", async () => {
    resetForgottenPassword.mockResolvedValue({ success: true, message: "ok" });
    const { result } = setup();
    const event = submitEvent();

    await act(() => result.current.handleSubmit(event));

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("refuses to submit when validation fails", async () => {
    const { result } = setup({ validate: () => false });

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.error).toBeNull();
    expect(resetForgottenPassword).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("refuses to submit without a reset token", async () => {
    const { result } = setup({ resetToken: undefined });

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.error).toBe(
      "Session will be expired. Please try again.",
    );
    expect(resetForgottenPassword).not.toHaveBeenCalled();
  });

  it("resets the password, finishes and shows the server message", async () => {
    resetForgottenPassword.mockResolvedValue({
      success: true,
      message: "Password changed",
    });
    const onSuccess = vi.fn();
    const { result } = setup({ onSuccess });

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(resetForgottenPassword).toHaveBeenCalledWith({
      password: "new-password",
      resetToken: "tok",
    });
    expect(result.current.isDone).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("Password changed");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("falls back to a default success message when the server sends none", async () => {
    resetForgottenPassword.mockResolvedValue({ success: true, message: "" });
    const { result } = setup();

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(toast.success).toHaveBeenCalledWith("Password reset successfully");
  });

  it("is loading while the request is in flight", async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    resetForgottenPassword.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { result } = setup();

    let submission: Promise<void> = Promise.resolve();
    act(() => {
      submission = result.current.handleSubmit(submitEvent());
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveRequest({ success: true, message: "ok" });
      await submission;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("exposes the error and shows an error toast when the request fails", async () => {
    resetForgottenPassword.mockRejectedValue(new Error("network down"));
    const onSuccess = vi.fn();
    const { result } = setup({ onSuccess });

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.error).toBeTruthy();
    expect(toast.error).toHaveBeenCalledWith(result.current.error);
    expect(toast.success).not.toHaveBeenCalled();
    expect(result.current.isDone).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("stops loading without finishing when the response is not a success", async () => {
    resetForgottenPassword.mockResolvedValue({ success: false, message: "no" });
    const { result } = setup();

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.isDone).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("clears a previous error on the next valid submit", async () => {
    resetForgottenPassword.mockRejectedValueOnce(new Error("boom"));
    const { result } = setup();
    await act(() => result.current.handleSubmit(submitEvent()));
    expect(result.current.error).toBeTruthy();

    resetForgottenPassword.mockResolvedValue({ success: true, message: "ok" });
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.error).toBeNull();
  });
});
