import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { describe, expect, it } from "vitest";

import { useLoginCredentials } from "./useLoginCredentials";

const changeEvent = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

describe("useLoginCredentials", () => {
  it("starts with empty credentials", () => {
    const { result } = renderHook(() => useLoginCredentials());

    expect(result.current.credentials).toEqual({ email: "", password: "" });
  });

  it("updates the email without touching the password", () => {
    const { result } = renderHook(() => useLoginCredentials());

    act(() => result.current.onEmailChange(changeEvent("jane@example.com")));

    expect(result.current.credentials).toEqual({
      email: "jane@example.com",
      password: "",
    });
  });

  it("updates the password without touching the email", () => {
    const { result } = renderHook(() => useLoginCredentials());

    act(() => result.current.onEmailChange(changeEvent("jane@example.com")));
    act(() => result.current.onPasswordChange(changeEvent("secret")));

    expect(result.current.credentials).toEqual({
      email: "jane@example.com",
      password: "secret",
    });
  });
});
