import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PrefetchLink } from "./PrefetchLink";

const login = vi.fn().mockResolvedValue(undefined);

vi.mock("@/routes/route-modules", () => ({
  routeModules: {
    login: () => login(),
  },
}));

describe("PrefetchLink", () => {
  beforeEach(() => {
    login.mockClear();
  });

  it("renders a link pointing at the given path", () => {
    render(
      <MemoryRouter>
        <PrefetchLink to="/auth/login" prefetchModule="login">
          Sign in
        </PrefetchLink>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth/login",
    );
  });

  it("prefetches the route module on hover", () => {
    render(
      <MemoryRouter>
        <PrefetchLink to="/auth/login" prefetchModule="login">
          Sign in
        </PrefetchLink>
      </MemoryRouter>,
    );

    expect(login).not.toHaveBeenCalled();
    fireEvent.mouseEnter(screen.getByRole("link"));
    expect(login).toHaveBeenCalledTimes(1);
  });

  it("prefetches the route module on focus", () => {
    render(
      <MemoryRouter>
        <PrefetchLink to="/auth/login" prefetchModule="login">
          Sign in
        </PrefetchLink>
      </MemoryRouter>,
    );

    fireEvent.focus(screen.getByRole("link"));
    expect(login).toHaveBeenCalledTimes(1);
  });

  it("still calls a caller-provided onMouseEnter/onFocus alongside the prefetch", () => {
    const onMouseEnter = vi.fn();
    const onFocus = vi.fn();

    render(
      <MemoryRouter>
        <PrefetchLink
          to="/auth/login"
          prefetchModule="login"
          onMouseEnter={onMouseEnter}
          onFocus={onFocus}
        >
          Sign in
        </PrefetchLink>
      </MemoryRouter>,
    );

    fireEvent.mouseEnter(screen.getByRole("link"));
    fireEvent.focus(screen.getByRole("link"));

    expect(onMouseEnter).toHaveBeenCalledTimes(1);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(login).toHaveBeenCalledTimes(2);
  });
});
