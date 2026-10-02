import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useResetPasswordValidation } from "./useResetPasswordValidation";

describe("useResetPasswordValidation", () => {
  it("starts without errors", () => {
    const { result } = renderHook(() =>
      useResetPasswordValidation("", ""),
    );

    expect(result.current.fieldErrors).toEqual({});
  });

  it("flags empty fields", () => {
    const { result } = renderHook(() =>
      useResetPasswordValidation("", ""),
    );

    let valid = true;
    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(false);
    expect(result.current.fieldErrors.password).toBe("Password is required");
    expect(result.current.fieldErrors.confirmPassword).toBe(
      "Confirm your password",
    );
  });

  it("flags a too short password", () => {
    const { result } = renderHook(() =>
      useResetPasswordValidation("short", "short"),
    );

    act(() => {
      result.current.validate();
    });

    expect(result.current.fieldErrors.password).toMatch(/at least 8/);
  });

  it("flags mismatching passwords", () => {
    const { result } = renderHook(() =>
      useResetPasswordValidation("long-enough-1", "long-enough-2"),
    );

    act(() => {
      result.current.validate();
    });

    expect(result.current.fieldErrors.confirmPassword).toBe(
      "Passwords don't match",
    );
  });

  it("passes with matching valid passwords", () => {
    const { result } = renderHook(() =>
      useResetPasswordValidation("long-enough-1", "long-enough-1"),
    );

    let valid = false;
    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(true);
  });

  it("clears a single field error", () => {
    const { result } = renderHook(() =>
      useResetPasswordValidation("", ""),
    );
    act(() => {
      result.current.validate();
    });

    act(() => result.current.clearFieldError("password"));

    expect(result.current.fieldErrors.password).toBeUndefined();
    expect(result.current.fieldErrors.confirmPassword).toBeTruthy();
  });
});
