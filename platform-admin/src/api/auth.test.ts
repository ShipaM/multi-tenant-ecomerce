import { beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "./auth";

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));

vi.mock("@/lib/axios", () => ({ Axios: http }));

type Case = {
  name: keyof typeof authApi;
  method: "get" | "post" | "put";
  url: string;
  args?: unknown[];
  body?: unknown;
};

const cases: Case[] = [
  {
    name: "login",
    method: "post",
    url: "/auth/login",
    args: [{ email: "a@b.co", password: "pw" }],
    body: { email: "a@b.co", password: "pw" },
  },
  { name: "me", method: "get", url: "/auth/me" },
  { name: "logout", method: "post", url: "/auth/logout" },
  {
    name: "updateUser",
    method: "put",
    url: "/users/me",
    args: [{ fullName: "Jane" }],
    body: { fullName: "Jane" },
  },
  {
    name: "changePassword",
    method: "put",
    url: "/users/change-password",
    args: [{ currentPassword: "a", newPassword: "b" }],
    body: { currentPassword: "a", newPassword: "b" },
  },
  {
    name: "twoFactorGenerateOtp",
    method: "post",
    url: "/auth/2fa-generate-otp",
  },
  {
    name: "verifyEnableDisableTwoFactor",
    method: "post",
    url: "/auth/2fa-verify-enable",
    args: [{ otp: "123456" }],
    body: { otp: "123456" },
  },
  {
    name: "verify2FaLoginOtp",
    method: "post",
    url: "/auth/2fa-verify-login-otp",
    args: [{ twoFactorToken: "tok", otp: "123456" }],
    body: { twoFactorToken: "tok", otp: "123456" },
  },
  { name: "sessions", method: "get", url: "/auth/sessions" },
  {
    name: "sessionRevoke",
    method: "post",
    url: "/auth/sessions/s1/revoke",
    args: [{ sessionId: "s1" }],
  },
  {
    name: "sessionRevokeOthers",
    method: "post",
    url: "/auth/sessions/revoke-others",
  },
  {
    name: "forgotPassword",
    method: "post",
    url: "/auth/forgot-password",
    args: [{ email: "a@b.co" }],
    body: { email: "a@b.co" },
  },
  {
    name: "forgotPasswordOtpVerify",
    method: "post",
    url: "/auth/forgot-password/verify-otp",
    args: [{ email: "a@b.co", otp: "123456" }],
    body: { email: "a@b.co", otp: "123456" },
  },
  {
    name: "resetForgottenPassword",
    method: "post",
    url: "/auth/reset-password",
    args: [{ password: "pw", resetToken: "tok" }],
    body: { password: "pw", resetToken: "tok" },
  },
];

describe("authApi", () => {
  beforeEach(() => {
    Object.values(http).forEach((fn) => fn.mockReset());
  });

  it.each(cases)(
    "$name calls $method $url and unwraps the response body",
    async ({ name, method, url, args = [], body }) => {
      http[method].mockResolvedValue({ data: { ok: name } });

      const call = authApi[name] as (...params: unknown[]) => Promise<unknown>;
      const result = await call(...args);

      expect(result).toEqual({ ok: name });
      expect(http[method]).toHaveBeenCalledTimes(1);
      expect(http[method].mock.calls[0]?.[0]).toBe(url);
      if (body !== undefined) {
        expect(http[method].mock.calls[0]?.[1]).toEqual(body);
      }
    },
  );

  it("passes a failed request through to the caller", async () => {
    http.post.mockRejectedValue(new Error("network down"));

    await expect(authApi.logout()).rejects.toThrow("network down");
  });
});
