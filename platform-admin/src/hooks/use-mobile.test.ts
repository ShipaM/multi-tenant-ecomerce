import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useIsMobile } from "./use-mobile";

type Listener = () => void;

const mockMatchMedia = (matches: boolean) => {
  const listeners = new Set<Listener>();
  const mql = {
    matches,
    addEventListener: vi.fn((_: string, listener: Listener) =>
      listeners.add(listener),
    ),
    removeEventListener: vi.fn((_: string, listener: Listener) =>
      listeners.delete(listener),
    ),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql);

  return {
    mql,
    change: (next: boolean) => {
      mql.matches = next;
      listeners.forEach((listener) => listener());
    },
  };
};

describe("useIsMobile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("queries the viewport below the tablet breakpoint", () => {
    mockMatchMedia(true);

    renderHook(() => useIsMobile());

    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
  });

  it("reports whether the viewport is mobile", () => {
    mockMatchMedia(true);
    expect(renderHook(() => useIsMobile()).result.current).toBe(true);

    mockMatchMedia(false);
    expect(renderHook(() => useIsMobile()).result.current).toBe(false);
  });

  it("follows viewport changes", () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());

    act(() => media.change(true));

    expect(result.current).toBe(true);
  });

  it("stops listening on unmount", () => {
    const media = mockMatchMedia(false);
    const { unmount } = renderHook(() => useIsMobile());

    unmount();

    expect(media.mql.removeEventListener).toHaveBeenCalled();
  });

  it("assumes desktop when rendered on the server", () => {
    mockMatchMedia(true);
    const Probe = () => createElement("span", null, String(useIsMobile()));

    expect(renderToString(createElement(Probe))).toContain("false");
  });
});
