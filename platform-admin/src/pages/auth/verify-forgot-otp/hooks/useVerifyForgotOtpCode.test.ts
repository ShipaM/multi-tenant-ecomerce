import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useVerifyForgotOtpCode } from "./useVerifyForgotOtpCode";

describe("useVerifyForgotOtpCode", () => {
  it("starts with an empty code", () => {
    const { result } = renderHook(() => useVerifyForgotOtpCode());

    expect(result.current.otp).toBe("");
  });

  it("updates the code", () => {
    const { result } = renderHook(() => useVerifyForgotOtpCode());

    act(() => result.current.onOtpChange("123456"));

    expect(result.current.otp).toBe("123456");
  });

  it("clears the code", () => {
    const { result } = renderHook(() => useVerifyForgotOtpCode());
    act(() => result.current.onOtpChange("123456"));

    act(() => result.current.resetOtp());

    expect(result.current.otp).toBe("");
  });
});
