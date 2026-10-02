import { act, renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import authReducer from "@/store/auth/authSlice";
import { useLoginSubmit } from "./useLoginSubmit";

const login = vi.fn();
const navigate = vi.fn();

vi.mock("@/api/auth", () => ({
  authApi: { login: (...args: unknown[]) => login(...args) },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useNavigate: () => navigate,
}));

const credentials = { email: "jane@example.com", password: "secret" };

const submitEvent = () =>
  ({ preventDefault: vi.fn() }) as unknown as Parameters<
    ReturnType<typeof useLoginSubmit>["handleSubmit"]
  >[0];

const completeResponse = {
  accessToken: "a",
  refreshToken: "r",
  userType: "PLATFORM_ADMIN",
};

const setup = (validate = () => true) => {
  const store = configureStore({ reducer: { auth: authReducer } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter useTransitions={false}>{children}</MemoryRouter>
    </Provider>
  );

  return renderHook(() => useLoginSubmit(credentials, "/orders", validate), {
    wrapper,
  });
};

describe("useLoginSubmit", () => {
  beforeEach(() => {
    login.mockReset();
    navigate.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("prevents the default form submission", async () => {
    login.mockResolvedValue(completeResponse);
    const { result } = setup();
    const event = submitEvent();

    await act(() => result.current.handleSubmit(event));

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("does not call the API or navigate when validation fails", async () => {
    const { result } = setup(() => false);

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(login).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("navigates to the redirect target after a complete login", async () => {
    login.mockResolvedValue(completeResponse);
    const { result } = setup();

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(login).toHaveBeenCalledWith(credentials);
    expect(navigate).toHaveBeenCalledWith("/orders", { replace: true });
    expect(toast.success).toHaveBeenCalledWith("Signed in successfully");
    expect(toast.error).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("moves to the 2FA step with the token, email and redirect target", async () => {
    login.mockResolvedValue({
      twoFactorRequired: true,
      twoFactorToken: "tok",
      message: "2FA required",
    });
    const { result } = setup();

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(toast.success).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/auth/2fa", {
      state: {
        twoFactorToken: "tok",
        email: "jane@example.com",
        redirectTo: "/orders",
      },
    });
  });

  it("exposes the error and does not navigate when login fails", async () => {
    login.mockRejectedValue(new Error("boom"));
    const { result } = setup();

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.error).toBeTruthy();
    expect(toast.error).toHaveBeenCalledWith(result.current.error);
    expect(toast.success).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("clears a previous error on the next submit", async () => {
    login.mockRejectedValueOnce(new Error("boom"));
    const { result } = setup();
    await act(() => result.current.handleSubmit(submitEvent()));
    expect(result.current.error).toBeTruthy();

    login.mockResolvedValue(completeResponse);
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.error).toBeNull();
  });
});
