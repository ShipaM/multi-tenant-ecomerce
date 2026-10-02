import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useLoginValidation } from "./useLoginValidation";

describe("useLoginValidation", () => {
  it("has no errors before validation runs", () => {
    const { result } = renderHook(() =>
      useLoginValidation({ email: "", password: "" }),
    );

    expect(result.current.fieldErrors).toEqual({});
  });

  it("reports errors and returns false for invalid credentials", () => {
    const { result } = renderHook(() =>
      useLoginValidation({ email: "nope", password: "" }),
    );

    let valid: boolean | undefined;
    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(false);
    expect(result.current.fieldErrors).toEqual({
      email: "Enter a valid email address",
      password: "Password is required",
    });
  });

  it("returns true and clears errors once the credentials are valid", () => {
    const { result, rerender } = renderHook(
      (props) => useLoginValidation(props),
      { initialProps: { email: "", password: "" } },
    );

    act(() => {
      result.current.validate();
    });
    rerender({ email: "jane@example.com", password: "secret" });

    let valid: boolean | undefined;
    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(true);
    expect(result.current.fieldErrors).toEqual({});
  });

  it("clears only the error of the edited field", () => {
    const { result } = renderHook(() =>
      useLoginValidation({ email: "", password: "" }),
    );

    act(() => {
      result.current.validate();
    });
    act(() => result.current.clearFieldError("email"));

    expect(result.current.fieldErrors.email).toBeUndefined();
    expect(result.current.fieldErrors.password).toBe("Password is required");
  });
});
