import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchForgotPassword,
  fetchForgotPasswordOtpVerify,
  resetForgottenPassword,
} from "./forgotPassword.thunks";
import { itBehavesLikeSimpleThunk, makeStore } from "./thunk-test-utils";

const api = vi.hoisted(() => ({
  forgotPassword: vi.fn(),
  forgotPasswordOtpVerify: vi.fn(),
  resetForgottenPassword: vi.fn(),
}));

vi.mock("@/api/auth", () => ({ authApi: api }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("fetchForgotPassword", () => {
  const payload = { email: "jane@example.com" };

  itBehavesLikeSimpleThunk({
    api: api.forgotPassword,
    run: (store) => store.dispatch(fetchForgotPassword(payload as never)),
    expectedArgs: [payload],
    data: { message: "sent" },
    fallback: "Failed to send forgot password email",
  });

  it("is not loading before the request", () => {
    expect(makeStore().getState().auth.isForgotPasswordLoading).toBe(false);
  });

  it("is loading while the request is in flight and not once it succeeds", async () => {
    api.forgotPassword.mockResolvedValue({ message: "sent" });
    const store = makeStore();

    const pending = store.dispatch(fetchForgotPassword(payload as never));
    expect(store.getState().auth.isForgotPasswordLoading).toBe(true);
    await pending;

    expect(store.getState().auth.isForgotPasswordLoading).toBe(false);
  });

  it("is not loading once the request fails", async () => {
    api.forgotPassword.mockRejectedValue(new Error("boom"));
    const store = makeStore();

    await store.dispatch(fetchForgotPassword(payload as never));

    expect(store.getState().auth.isForgotPasswordLoading).toBe(false);
  });
});

describe("fetchForgotPasswordOtpVerify", () => {
  const payload = { email: "jane@example.com", otp: "123456" };

  itBehavesLikeSimpleThunk({
    api: api.forgotPasswordOtpVerify,
    run: (store) =>
      store.dispatch(fetchForgotPasswordOtpVerify(payload as never)),
    expectedArgs: [payload],
    data: { message: "verified", resetToken: "tok" },
    fallback: "Failed to verify forgot password otp",
  });

  it("is not loading before the request", () => {
    expect(makeStore().getState().auth.isForgotPasswordOtpVerifyLoading).toBe(
      false,
    );
  });

  it("is loading while the request is in flight and not once it succeeds", async () => {
    api.forgotPasswordOtpVerify.mockResolvedValue({ message: "ok" });
    const store = makeStore();

    const pending = store.dispatch(
      fetchForgotPasswordOtpVerify(payload as never),
    );
    expect(store.getState().auth.isForgotPasswordOtpVerifyLoading).toBe(true);
    await pending;

    expect(store.getState().auth.isForgotPasswordOtpVerifyLoading).toBe(false);
  });

  it("is not loading once the request fails", async () => {
    api.forgotPasswordOtpVerify.mockRejectedValue(new Error("boom"));
    const store = makeStore();

    await store.dispatch(fetchForgotPasswordOtpVerify(payload as never));

    expect(store.getState().auth.isForgotPasswordOtpVerifyLoading).toBe(false);
  });
});

describe("resetForgottenPassword", () => {
  const payload = { resetToken: "tok", password: "new-password" };

  itBehavesLikeSimpleThunk({
    api: api.resetForgottenPassword,
    run: (store) => store.dispatch(resetForgottenPassword(payload as never)),
    expectedArgs: [payload],
    data: { message: "reset" },
    fallback: "Failed to reset password",
  });

  it("is not loading before the request", () => {
    expect(makeStore().getState().auth.isResetPasswordLoading).toBe(false);
  });

  it("is loading while the request is in flight and not once it succeeds", async () => {
    api.resetForgottenPassword.mockResolvedValue({ message: "ok" });
    const store = makeStore();

    const pending = store.dispatch(resetForgottenPassword(payload as never));
    expect(store.getState().auth.isResetPasswordLoading).toBe(true);
    await pending;

    expect(store.getState().auth.isResetPasswordLoading).toBe(false);
  });

  it("is not loading once the request fails", async () => {
    api.resetForgottenPassword.mockRejectedValue(new Error("boom"));
    const store = makeStore();

    await store.dispatch(resetForgottenPassword(payload as never));

    expect(store.getState().auth.isResetPasswordLoading).toBe(false);
  });
});
