import { beforeEach, describe, expect, it, vi } from "vitest";

import { LOCAL_STORAGE_KEYS } from "@/lib/storage";
import { installStorage } from "@/test/storage";

// The slice reads storage at import time, so every case needs a fresh module.
async function loadInitialState() {
  vi.resetModules();

  const reducer = (await import("@/store/auth/authSlice")).default;

  return reducer(undefined, { type: "@@INIT" });
}

describe("auth initial state", () => {
  beforeEach(() => {
    installStorage();
  });

  it("restores a stored session", async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, "access");
    localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, "refresh");
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_TYPE, "PLATFORM_ADMIN");

    expect(await loadInitialState()).toMatchObject({
      accessToken: "access",
      refreshToken: "refresh",
      userType: "PLATFORM_ADMIN",
    });
  });

  it("starts signed out when storage is empty", async () => {
    expect(await loadInitialState()).toMatchObject({
      accessToken: null,
      refreshToken: null,
      userType: "PLATFORM_ADMIN",
    });
  });

  it("defaults to PLATFORM_ADMIN regardless of the stored user type", async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, "access");
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_TYPE, "SUPER_ADMIN");

    expect(await loadInitialState()).toMatchObject({
      accessToken: "access",
      userType: "PLATFORM_ADMIN",
    });
  });

  it("survives a browser that refuses storage access", async () => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: () => {
          throw new Error("SecurityError");
        },
        setItem: () => {
          throw new Error("SecurityError");
        },
        removeItem: () => {},
        clear: () => {},
      },
      writable: true,
      configurable: true,
    });

    expect(await loadInitialState()).toMatchObject({
      accessToken: null,
      userType: "PLATFORM_ADMIN",
    });
  });
});

describe("auth reducers", () => {
  beforeEach(() => {
    installStorage();
  });

  async function load() {
    vi.resetModules();

    const slice = await import("@/store/auth/authSlice");
    const thunks = await import("@/store/auth/thunks");

    return { ...slice, ...thunks };
  }

  const request = "request-id";
  const failure = new Error("boom");

  it("clears the stored error", async () => {
    const { default: reducer, clearAuthError, fetchLogin } = await load();
    const failed = reducer(
      undefined,
      fetchLogin.rejected(
        failure,
        request,
        { email: "a@b.co", password: "x" },
        "Nope",
      ),
    );
    expect(failed.error).toBe("Nope");

    expect(reducer(failed, clearAuthError()).error).toBeNull();
  });

  it("falls back to a default message when sign-in fails without one", async () => {
    const { default: reducer, fetchLogin } = await load();

    const state = reducer(
      undefined,
      fetchLogin.rejected(failure, request, { email: "a@b.co", password: "x" }),
    );

    expect(state.error).toBe("Could not Sign in");
  });

  it("falls back to a default message when loading the current user fails without one", async () => {
    const { default: reducer, fetchMe } = await load();

    const state = reducer(undefined, fetchMe.rejected(failure, request));

    expect(state.error).toBe("Could not load the current user");
  });

  it("falls back to a default message when sign-out fails without one", async () => {
    const { default: reducer, fetchLogout } = await load();

    const state = reducer(undefined, fetchLogout.rejected(failure, request));

    expect(state.error).toBe("Could not Sign out");
  });

  it("falls back to a default message when the 2FA sign-in fails without one", async () => {
    const { default: reducer, verify2FaLoginOtp } = await load();

    const state = reducer(
      undefined,
      verify2FaLoginOtp.rejected(failure, request, {
        twoFactorToken: "tok",
        otp: "123456",
      }),
    );

    expect(state.error).toBe("Could not Sign in");
  });

  describe("enabling or disabling two-factor authentication", () => {
    const payload = { otp: "123456" } as never;
    const response = { data: { twoFactorEnabled: true } } as never;

    it("updates the signed-in user", async () => {
      const {
        default: reducer,
        fetchMe,
        verifyEnableDisableTwoFactor,
      } = await load();
      const signedIn = reducer(
        undefined,
        fetchMe.fulfilled(
          { id: "u1", email: "a@b.co", fullName: "Jane Doe" } as never,
          request,
        ),
      );

      const state = reducer(
        signedIn,
        verifyEnableDisableTwoFactor.fulfilled(response, request, payload),
      );

      expect(state.user?.twoFactorEnabled).toBe(true);
    });

    it("leaves the state alone when nobody is signed in", async () => {
      const { default: reducer, verifyEnableDisableTwoFactor } = await load();

      const state = reducer(
        undefined,
        verifyEnableDisableTwoFactor.fulfilled(response, request, payload),
      );

      expect(state.user).toBeNull();
    });
  });
});
