import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useVerify2FaOtp } from "./useVerify2FaOtp";

describe("useVerify2FaOtp", () => {
  it("starts with an empty code", () => {
    const { result } = renderHook(() => useVerify2FaOtp());

    expect(result.current.otp).toBe("");
  });

  it("updates the code", () => {
    const { result } = renderHook(() => useVerify2FaOtp());

    act(() => result.current.onOtpChange("123456"));

    expect(result.current.otp).toBe("123456");
  });
});
