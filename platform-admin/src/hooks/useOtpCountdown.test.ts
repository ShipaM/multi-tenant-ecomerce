import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useOtpCountdown } from "./useOtpCountdown";

const NOW = new Date("2026-10-02T10:00:00.000Z");
const secondsAgo = (seconds: number) =>
  new Date(NOW.getTime() - seconds * 1000);

describe("useOtpCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts the five minutes the code lives from when it was created", () => {
    const { result } = renderHook(() => useOtpCountdown(secondsAgo(60)));

    expect(result.current).toEqual({
      remainingSeconds: 240,
      formattedTime: "04:00",
      isExpired: false,
    });
  });

  it("honours a custom lifetime", () => {
    const { result } = renderHook(() => useOtpCountdown(secondsAgo(0), 1));

    expect(result.current.remainingSeconds).toBe(60);
    expect(result.current.formattedTime).toBe("01:00");
  });

  it("ticks down every second and expires at zero", () => {
    const createdAt = secondsAgo(298);
    const { result } = renderHook(() => useOtpCountdown(createdAt));
    expect(result.current.remainingSeconds).toBe(2);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remainingSeconds).toBe(1);
    expect(result.current.isExpired).toBe(false);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toEqual({
      remainingSeconds: 0,
      formattedTime: "00:00",
      isExpired: true,
    });
  });

  it("is expired when the code is older than its lifetime", () => {
    const { result } = renderHook(() => useOtpCountdown(secondsAgo(600)));

    expect(result.current.isExpired).toBe(true);
  });

  it("is expired and does not tick without a creation time", () => {
    const { result } = renderHook(() => useOtpCountdown(undefined));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.isExpired).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("restarts when a new creation time arrives", () => {
    const { result, rerender } = renderHook(
      ({ createdAt }: { createdAt: Date }) => useOtpCountdown(createdAt),
      { initialProps: { createdAt: secondsAgo(600) } },
    );
    expect(result.current.isExpired).toBe(true);

    rerender({ createdAt: secondsAgo(0) });

    expect(result.current.remainingSeconds).toBe(300);
    expect(result.current.isExpired).toBe(false);
  });

  it("stops ticking on unmount", () => {
    const createdAt = secondsAgo(10);
    const { unmount } = renderHook(() => useOtpCountdown(createdAt));
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
