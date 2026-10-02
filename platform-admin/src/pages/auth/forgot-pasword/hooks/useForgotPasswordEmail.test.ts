import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { describe, expect, it } from "vitest";

import { useForgotPasswordEmail } from "./useForgotPasswordEmail";

const changeEvent = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

describe("useForgotPasswordEmail", () => {
  it("starts with an empty email", () => {
    const { result } = renderHook(() => useForgotPasswordEmail());

    expect(result.current.email).toBe("");
  });

  it("updates the email when the input changes", () => {
    const { result } = renderHook(() => useForgotPasswordEmail());

    act(() => result.current.onEmailChange(changeEvent("jane@example.com")));

    expect(result.current.email).toBe("jane@example.com");
  });

  it("clears the email on reset", () => {
    const { result } = renderHook(() => useForgotPasswordEmail());
    act(() => result.current.onEmailChange(changeEvent("jane@example.com")));

    act(() => result.current.resetEmail());

    expect(result.current.email).toBe("");
  });
});
