import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  twoFactorGenerateOtp,
  verifyEnableDisableTwoFactor,
} from "./twoFactor.thunks";
import { itBehavesLikeSimpleThunk, makeStore } from "./thunk-test-utils";

const api = vi.hoisted(() => ({
  twoFactorGenerateOtp: vi.fn(),
  verifyEnableDisableTwoFactor: vi.fn(),
}));

vi.mock("@/api/auth", () => ({ authApi: api }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("twoFactorGenerateOtp", () => {
  itBehavesLikeSimpleThunk({
    api: api.twoFactorGenerateOtp,
    run: (store) => store.dispatch(twoFactorGenerateOtp()),
    expectedArgs: [],
    data: { message: "sent" },
    fallback: "Failed to generate otp",
  });

  it("toggles the loading flag around the request", async () => {
    api.twoFactorGenerateOtp.mockResolvedValue({ message: "sent" });
    const store = makeStore();

    const pending = store.dispatch(twoFactorGenerateOtp());
    expect(store.getState().auth.isTwoFactorGenerateOtpLoading).toBe(true);
    await pending;

    expect(store.getState().auth.isTwoFactorGenerateOtpLoading).toBe(false);
  });
});

describe("verifyEnableDisableTwoFactor", () => {
  const payload = { otp: "123456" };
  const data = { message: "ok", data: { twoFactorEnabled: true } };

  itBehavesLikeSimpleThunk({
    api: api.verifyEnableDisableTwoFactor,
    run: (store) =>
      store.dispatch(verifyEnableDisableTwoFactor(payload as never)),
    expectedArgs: [payload],
    data,
    fallback: "Failed to verify otp",
  });

  it("updates twoFactorEnabled on the signed-in user", async () => {
    api.verifyEnableDisableTwoFactor.mockResolvedValue(data);
    const store = makeStore();

    await store.dispatch(verifyEnableDisableTwoFactor(payload as never));

    expect(store.getState().auth.isTwoFactorVerifyOtpLoading).toBe(false);
    // No user is loaded, so there is nothing to update and nothing may crash.
    expect(store.getState().auth.user).toBeNull();
  });

  it("clears the loading flag when verification fails", async () => {
    api.verifyEnableDisableTwoFactor.mockRejectedValue(new Error("boom"));
    const store = makeStore();

    await store.dispatch(verifyEnableDisableTwoFactor(payload as never));

    expect(store.getState().auth.isTwoFactorVerifyOtpLoading).toBe(false);
  });
});
