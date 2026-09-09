import { beforeEach, describe, expect, it, vi } from "vitest";

import { LOCAL_STORAGE_KEYS } from "@/lib/storage";

// The runtime hands jsdom a partial localStorage, so the test brings its own.
function installStorage() {
  const entries = new Map<string, string>();

  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
      removeItem: (key: string) => entries.delete(key),
      clear: () => entries.clear(),
    },
    writable: true,
    configurable: true,
  });
}

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
      userType: null,
    });
  });

  it("ignores a user type that is not one of the known roles", async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, "access");
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_TYPE, "SUPER_ADMIN");

    expect(await loadInitialState()).toMatchObject({
      accessToken: "access",
      userType: null,
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
      userType: null,
    });
  });
});
