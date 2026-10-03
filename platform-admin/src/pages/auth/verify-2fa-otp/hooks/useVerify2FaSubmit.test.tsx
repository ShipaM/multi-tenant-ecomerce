import { act, renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";

import authReducer from "@/store/auth/authSlice";
import { useVerify2FaSubmit } from "./useVerify2FaSubmit";

const verify2FaLoginOtp = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn());

vi.mock("@/api/auth", () => ({ authApi: { verify2FaLoginOtp } }));
vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useNavigate: () => navigate,
}));

type Params = Parameters<typeof useVerify2FaSubmit>[0];

const baseParams: Params = {
  otp: "123456",
  email: "jane@example.com",
  twoFactorToken: "2fa-tok",
  redirectTo: "/dashboard",
};

const completeResponse = {
  accessToken: "access",
  refreshToken: "refresh",
  userType: "PLATFORM_ADMIN",
};

const submitEvent = () =>
  ({ preventDefault: vi.fn() }) as unknown as Parameters<
    ReturnType<typeof useVerify2FaSubmit>["handleSubmit"]
  >[0];

const setup = (overrides: Partial<Params> = {}) => {
  const store = configureStore({ reducer: { auth: authReducer } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return renderHook(() => useVerify2FaSubmit({ ...baseParams, ...overrides }), {
    wrapper,
  });
};

describe("useVerify2FaSubmit", () => {
  beforeEach(() => {
    verify2FaLoginOtp.mockReset();
    navigate.mockReset();
  });

  it("starts idle with no error", () => {
    const { result } = setup();

    expect(result.current).toMatchObject({ isVerifying: false, error: null });
  });

  it("prevents the default form submission", async () => {
    verify2FaLoginOtp.mockResolvedValue(completeResponse);
    const { result } = setup();
    const event = submitEvent();

    await act(() => result.current.handleSubmit(event));

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("sends the token and code, then enters the app on a complete login", async () => {
    verify2FaLoginOtp.mockResolvedValue(completeResponse);
    const { result } = setup({ redirectTo: "/orders" });

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(verify2FaLoginOtp).toHaveBeenCalledWith({
      twoFactorToken: "2fa-tok",
      otp: "123456",
    });
    expect(navigate).toHaveBeenCalledWith("/orders", { replace: true });
    expect(result.current.error).toBeNull();
  });

  it("moves to another 2FA step when the server asks for one", async () => {
    verify2FaLoginOtp.mockResolvedValue({
      twoFactorRequired: true,
      twoFactorToken: "next-tok",
    });
    const { result } = setup({ redirectTo: "/orders" });

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(navigate).toHaveBeenCalledWith("/auth/2fa", {
      state: {
        twoFactorToken: "next-tok",
        email: "jane@example.com",
        redirectTo: "/orders",
      },
    });
  });

  it("falls back to an empty token when the session has none", async () => {
    verify2FaLoginOtp.mockResolvedValue(completeResponse);
    const { result } = setup({ twoFactorToken: undefined });

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(verify2FaLoginOtp).toHaveBeenCalledWith({
      twoFactorToken: "",
      otp: "123456",
    });
  });

  it("is verifying while the request is in flight", async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    verify2FaLoginOtp.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { result } = setup();

    let submission: Promise<void> = Promise.resolve();
    act(() => {
      submission = result.current.handleSubmit(submitEvent());
    });
    expect(result.current.isVerifying).toBe(true);

    await act(async () => {
      resolveRequest(completeResponse);
      await submission;
    });

    expect(result.current.isVerifying).toBe(false);
  });

  it("exposes the error and stays on the page when the request fails", async () => {
    verify2FaLoginOtp.mockRejectedValue(new Error("network down"));
    const { result } = setup();

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.error).toBeTruthy();
    expect(result.current.isVerifying).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("clears a previous error on the next submit", async () => {
    verify2FaLoginOtp.mockRejectedValueOnce(new Error("boom"));
    const { result } = setup();
    await act(() => result.current.handleSubmit(submitEvent()));
    expect(result.current.error).toBeTruthy();

    verify2FaLoginOtp.mockResolvedValue(completeResponse);
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.error).toBeNull();
  });
});
