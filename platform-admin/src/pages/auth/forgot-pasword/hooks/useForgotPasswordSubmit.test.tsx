import { act, renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import authReducer from "@/store/auth/authSlice";
import { useForgotPasswordSubmit } from "./useForgotPasswordSubmit";

const forgotPassword = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn());

vi.mock("@/api/auth", () => ({ authApi: { forgotPassword } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useNavigate: () => navigate,
}));

const email = "jane@example.com";
const createdAt = new Date("2026-10-02T10:00:00Z");
const successResponse = {
  success: true,
  message: "OTP sent",
  data: { createdAt },
};

const submitEvent = () =>
  ({ preventDefault: vi.fn() }) as unknown as Parameters<
    ReturnType<typeof useForgotPasswordSubmit>["handleSubmit"]
  >[0];

const setup = (validate = () => true, onSuccess?: () => void) => {
  const store = configureStore({ reducer: { auth: authReducer } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter useTransitions={false}>{children}</MemoryRouter>
    </Provider>
  );

  return renderHook(() => useForgotPasswordSubmit(email, validate, onSuccess), {
    wrapper,
  });
};

describe("useForgotPasswordSubmit", () => {
  beforeEach(() => {
    forgotPassword.mockReset();
    navigate.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("starts idle with no error", () => {
    const { result } = setup();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("does not call the api, navigate or toast when validation fails", async () => {
    const { result } = setup(() => false);

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(forgotPassword).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("prevents the default form submission", async () => {
    forgotPassword.mockResolvedValue(successResponse);
    const { result } = setup();
    const event = submitEvent();

    await act(() => result.current.handleSubmit(event));

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("requests the code, opens the OTP step and shows a success toast", async () => {
    forgotPassword.mockResolvedValue(successResponse);
    const onSuccess = vi.fn();
    const { result } = setup(() => true, onSuccess);

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(forgotPassword).toHaveBeenCalledWith({ email });
    expect(navigate).toHaveBeenCalledWith("/auth/forgot-password/otp", {
      state: { email, createdAt },
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("OTP sent");
    expect(toast.error).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("is loading while the request is in flight", async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    forgotPassword.mockReturnValue(
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
      resolveRequest(successResponse);
      await submission;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("exposes the server message and shows an error toast when the request fails", async () => {
    forgotPassword.mockRejectedValue(new Error("network down"));
    const onSuccess = vi.fn();
    const { result } = setup(() => true, onSuccess);

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.error).toBeTruthy();
    expect(toast.error).toHaveBeenCalledWith(result.current.error);
    expect(toast.success).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("stops loading and stays on the page when the response is not a success", async () => {
    forgotPassword.mockResolvedValue({ ...successResponse, success: false });
    const { result } = setup();

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(navigate).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("clears a previous error on the next submit", async () => {
    forgotPassword.mockRejectedValueOnce(new Error("boom"));
    const { result } = setup();
    await act(() => result.current.handleSubmit(submitEvent()));
    expect(result.current.error).toBeTruthy();

    forgotPassword.mockResolvedValue(successResponse);
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.error).toBeNull();
  });
});
