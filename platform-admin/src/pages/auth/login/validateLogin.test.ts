import { describe, expect, it } from "vitest";

import { validateLogin } from "./validateLogin";

describe("validateLogin", () => {
  it("collects errors for every invalid field", () => {
    expect(validateLogin({ email: "", password: "" })).toEqual({
      email: "Email is required",
      password: "Password is required",
    });
  });

  it("reports only the invalid field", () => {
    expect(validateLogin({ email: "a@b.co", password: "" })).toEqual({
      password: "Password is required",
    });
  });

  it("returns no errors for valid credentials", () => {
    expect(validateLogin({ email: "a@b.co", password: "pw" })).toEqual({});
  });
});
