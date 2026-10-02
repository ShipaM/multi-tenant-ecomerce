import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { describe, expect, it } from "vitest";

import { useResetPasswordForm } from "./useResetPasswordForm";

const changeEvent = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

describe("useResetPasswordForm", () => {
  it("starts with empty fields and no mismatch", () => {
    const { result } = renderHook(() => useResetPasswordForm());

    expect(result.current.password).toBe("");
    expect(result.current.confirmPassword).toBe("");
    expect(result.current.isMismatch).toBe(false);
  });

  it("updates each field independently", () => {
    const { result } = renderHook(() => useResetPasswordForm());

    act(() => result.current.onPasswordChange(changeEvent("secret-1")));
    expect(result.current.password).toBe("secret-1");
    expect(result.current.confirmPassword).toBe("");

    act(() => result.current.onConfirmPasswordChange(changeEvent("secret-2")));
    expect(result.current.password).toBe("secret-1");
    expect(result.current.confirmPassword).toBe("secret-2");
  });

  it("does not report a mismatch until a confirmation is typed", () => {
    const { result } = renderHook(() => useResetPasswordForm());

    act(() => result.current.onPasswordChange(changeEvent("secret-1")));

    expect(result.current.isMismatch).toBe(false);
  });

  it("reports a mismatch when the confirmation differs", () => {
    const { result } = renderHook(() => useResetPasswordForm());

    act(() => result.current.onPasswordChange(changeEvent("secret-1")));
    act(() => result.current.onConfirmPasswordChange(changeEvent("secret-2")));

    expect(result.current.isMismatch).toBe(true);
  });

  it("clears the mismatch once the confirmation matches", () => {
    const { result } = renderHook(() => useResetPasswordForm());
    act(() => result.current.onPasswordChange(changeEvent("secret-1")));
    act(() => result.current.onConfirmPasswordChange(changeEvent("secret-2")));

    act(() => result.current.onConfirmPasswordChange(changeEvent("secret-1")));

    expect(result.current.isMismatch).toBe(false);
  });

  it("clears both fields on reset", () => {
    const { result } = renderHook(() => useResetPasswordForm());
    act(() => result.current.onPasswordChange(changeEvent("secret-1")));
    act(() => result.current.onConfirmPasswordChange(changeEvent("secret-1")));

    act(() => result.current.resetForm());

    expect(result.current.password).toBe("");
    expect(result.current.confirmPassword).toBe("");
    expect(result.current.isMismatch).toBe(false);
  });
});
