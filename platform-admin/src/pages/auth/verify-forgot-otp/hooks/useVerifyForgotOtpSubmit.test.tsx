import { act, renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import authReducer from "@/store/auth/authSlice";
import { useVerifyForgotOtpSubmit } from "./useVerifyForgotOtpSubmit";

const forgotPasswordOtpVerify = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn());

vi.mock("@/api/auth", () => ({ authApi: { forgotPasswordOtpVerify } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useNavigate: () => navigate,
}));

type Params = Parameters<typeof useVerifyForgotOtpSubmit>[0];

const baseParams: Params = {
  email: "jane@example.com",
  otp: "123456",
  redirectTo: undefined,
};

const successResponse = {
  success: true,
  message: "Verified",
  data: { resetToken: "tok" },
};

const submitEvent = () =>
  ({ preventDefault: vi.fn() }) as unknown as Parameters<
    ReturnType<typeof useVerifyForgotOtpSubmit>["handleSubmit"]
  >[0];

const setup = (overrides: Partial<Params> = {}) => {
  const store = configureStore({ reducer: { auth: authReducer } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return renderHook(
    () => useVerifyForgotOtpSubmit({ ...baseParams, ...overrides }),
    { wrapper },
  );
};

describe("useVerifyForgotOtpSubmit", () => {
  beforeEach(() => {
    forgotPasswordOtpVerify.mockReset();
    navigate.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("starts idle with no error", () => {
    const { result } = setup();

    expect(result.current).toMatchObject({ isSubmitting: false, error: null });
  });

  it("prevents the default form submission", async () => {
    forgotPasswordOtpVerify.mockResolvedValue(successResponse);
    const { result } = setup();
    const event = submitEvent();

    await act(() => result.current.handleSubmit(event));

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("verifies the code, opens the reset step and shows the server message", async () => {
    forgotPasswordOtpVerify.mockResolvedValue(successResponse);
    const onSuccess = vi.fn();
    const { result } = setup({ onSuccess, redirectTo: "/orders" });

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(forgotPasswordOtpVerify).toHaveBeenCalledWith({
      email: "jane@example.com",
      otp: "123456",
    });
    expect(navigate).toHaveBeenCalledWith("/auth/reset-password", {
      state: {
        email: "jane@example.com",
        resetToken: "tok",
        redirectTo: "/orders",
      },
      replace: true,
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("Verified");
    expect(result.current.error).toBeNull();
  });

  it("is submitting while the request is in flight", async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    forgotPasswordOtpVerify.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { result } = setup();

    let submission: Promise<void> = Promise.resolve();
    act(() => {
      submission = result.current.handleSubmit(submitEvent());
    });
    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      resolveRequest(successResponse);
      await submission;
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  it("exposes the error and shows an error toast when the request fails", async () => {
    forgotPasswordOtpVerify.mockRejectedValue(new Error("network down"));
    const onSuccess = vi.fn();
    const { result } = setup({ onSuccess });

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.error).toBeTruthy();
    expect(toast.error).toHaveBeenCalledWith(result.current.error);
    expect(result.current.isSubmitting).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("stops submitting without moving on when the response is not a success", async () => {
    forgotPasswordOtpVerify.mockResolvedValue({
      ...successResponse,
      success: false,
    });
    const { result } = setup();

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.isSubmitting).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("clears a previous error on the next submit", async () => {
    forgotPasswordOtpVerify.mockRejectedValueOnce(new Error("boom"));
    const { result } = setup();
    await act(() => result.current.handleSubmit(submitEvent()));
    expect(result.current.error).toBeTruthy();

    forgotPasswordOtpVerify.mockResolvedValue(successResponse);
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.error).toBeNull();
  });
});
