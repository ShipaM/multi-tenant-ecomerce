import { describe, expect, it } from "vitest";

import { buildLoginUrl, isSafeRedirectPath } from "./redirect";

describe("isSafeRedirectPath", () => {
  it("accepts in-app paths", () => {
    expect(isSafeRedirectPath("/orders?page=2")).toBe(true);
  });

  it.each([
    "https://evil.example.com",
    "//evil.example.com",
    "/" + String.fromCharCode(92) + "evil",
    "orders",
  ])("rejects %s", (path) => {
    expect(isSafeRedirectPath(path)).toBe(false);
  });
});

describe("buildLoginUrl", () => {
  it("returns the plain login path without a target", () => {
    expect(buildLoginUrl()).toBe("/auth/login");
    expect(buildLoginUrl("")).toBe("/auth/login");
  });

  it("carries a safe target as an encoded redirect_uri", () => {
    expect(buildLoginUrl("/orders?page=2")).toBe(
      "/auth/login?redirect_uri=%2Forders%3Fpage%3D2",
    );
  });

  it("drops the default target", () => {
    expect(buildLoginUrl("/dashboard")).toBe("/auth/login");
  });

  it("drops an unsafe target", () => {
    expect(buildLoginUrl("//evil.example.com")).toBe("/auth/login");
  });
});
