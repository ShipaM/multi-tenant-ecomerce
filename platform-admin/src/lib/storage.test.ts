import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installStorage } from "@/test/storage";
import { LOCAL_STORAGE_KEYS, storage } from "./storage";

describe("storage", () => {
  let fake: ReturnType<typeof installStorage>;

  beforeEach(() => {
    fake = installStorage();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("round-trips the token pair", () => {
    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBeNull();

    storage.setTokens("access", "refresh");

    expect(storage.getAccessToken()).toBe("access");
    expect(storage.getRefreshToken()).toBe("refresh");
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN)).toBe(
      "access",
    );
  });

  it("round-trips a valid user type and ignores an unknown one", () => {
    expect(storage.getUserType()).toBeNull();

    storage.setUserType("PLATFORM_ADMIN");
    expect(storage.getUserType()).toBe("PLATFORM_ADMIN");

    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_TYPE, "NOT_A_TYPE");
    expect(storage.getUserType()).toBeNull();
  });

  it("clears a single field", () => {
    storage.setTokens("access", "refresh");

    storage.clearField(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBe("refresh");
  });

  it("clears everything", () => {
    storage.setTokens("access", "refresh");
    storage.setUserType("PLATFORM_ADMIN");

    storage.clearStorage();

    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBeNull();
    expect(storage.getUserType()).toBeNull();
  });

  describe("when storage is unavailable", () => {
    const failWith = (method: "getItem" | "setItem" | "removeItem" | "clear") =>
      vi.spyOn(fake, method).mockImplementation(() => {
        throw new Error("denied");
      });

    it("reads as empty instead of throwing", () => {
      failWith("getItem");

      expect(storage.getAccessToken()).toBeNull();
      expect(storage.getRefreshToken()).toBeNull();
      expect(storage.getUserType()).toBeNull();
    });

    it("ignores failed writes", () => {
      failWith("setItem");

      expect(() => storage.setTokens("a", "r")).not.toThrow();
      expect(() => storage.setUserType("PLATFORM_ADMIN")).not.toThrow();
    });

    it("ignores failed removals", () => {
      failWith("removeItem");

      expect(() => storage.clearField("x")).not.toThrow();
    });

    it("ignores a failed clear", () => {
      failWith("clear");

      expect(() => storage.clearStorage()).not.toThrow();
    });
  });
});
