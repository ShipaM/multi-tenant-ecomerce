import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useForgotPasswordValidation } from "./useForgotPasswordValidation";

describe("useForgotPasswordValidation", () => {
  it("has no error before validation runs", () => {
    const { result } = renderHook(() => useForgotPasswordValidation(""));

    expect(result.current.emailError).toBeUndefined();
  });

  it("reports a required error for an empty email", () => {
    const { result } = renderHook(() => useForgotPasswordValidation(""));

    let valid: boolean | undefined;
    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(false);
    expect(result.current.emailError).toBe("Email is required");
  });

  it("reports a format error for a malformed email", () => {
    const { result } = renderHook(() => useForgotPasswordValidation("jane@"));

    let valid: boolean | undefined;
    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(false);
    expect(result.current.emailError).toBe("Enter a valid email address");
  });

  it("returns true and clears the error once the email is valid", () => {
    const { result, rerender } = renderHook(
      (email) => useForgotPasswordValidation(email),
      { initialProps: "" },
    );
    act(() => {
      result.current.validate();
    });

    rerender("jane@example.com");
    let valid: boolean | undefined;
    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(true);
    expect(result.current.emailError).toBeUndefined();
  });

  it("clears the error on demand", () => {
    const { result } = renderHook(() => useForgotPasswordValidation(""));
    act(() => {
      result.current.validate();
    });

    act(() => result.current.clearEmailError());

    expect(result.current.emailError).toBeUndefined();
  });
});
