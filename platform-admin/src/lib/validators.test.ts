import { describe, expect, it } from "vitest";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateConfirmPassword,
  validateEmail,
  validateNewPassword,
  validatePassword,
} from "./validators";

describe("validators", () => {
  it("requires an email", () => {
    expect(validateEmail("")).toBe("Email is required");
    expect(validateEmail("   ")).toBe("Email is required");
  });

  it("rejects a malformed email", () => {
    expect(validateEmail("jane")).toBe("Enter a valid email address");
    expect(validateEmail("jane@")).toBe("Enter a valid email address");
    expect(validateEmail("jane@example")).toBe("Enter a valid email address");
    expect(validateEmail("ja ne@example.com")).toBe(
      "Enter a valid email address",
    );
  });

  it("accepts a valid email, ignoring surrounding whitespace", () => {
    expect(validateEmail("jane@example.com")).toBeUndefined();
    expect(validateEmail("  jane@example.com ")).toBeUndefined();
  });

  it("requires a password", () => {
    expect(validatePassword("")).toBe("Password is required");
    expect(validatePassword("x")).toBeUndefined();
  });

  describe("validateNewPassword", () => {
    it("requires a password", () => {
      expect(validateNewPassword("")).toBe("Password is required");
    });

    it("enforces the minimum length", () => {
      expect(validateNewPassword("a".repeat(PASSWORD_MIN_LENGTH - 1))).toBe(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      );
      expect(
        validateNewPassword("a".repeat(PASSWORD_MIN_LENGTH)),
      ).toBeUndefined();
    });

    it("enforces the maximum length", () => {
      expect(validateNewPassword("a".repeat(PASSWORD_MAX_LENGTH + 1))).toBe(
        `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
      );
      expect(
        validateNewPassword("a".repeat(PASSWORD_MAX_LENGTH)),
      ).toBeUndefined();
    });
  });

  describe("validateConfirmPassword", () => {
    it("requires the confirmation", () => {
      expect(validateConfirmPassword("secret-password", "")).toBe(
        "Confirm your password",
      );
    });

    it("rejects a confirmation that differs", () => {
      expect(validateConfirmPassword("secret-password", "other-password")).toBe(
        "Passwords don't match",
      );
    });

    it("accepts a matching confirmation", () => {
      expect(
        validateConfirmPassword("secret-password", "secret-password"),
      ).toBeUndefined();
    });
  });
});
