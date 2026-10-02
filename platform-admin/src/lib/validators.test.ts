import { describe, expect, it } from "vitest";
import { validateEmail, validatePassword } from "./validators";

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
});
