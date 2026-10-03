import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RouteErrorBoundary } from "./RouteErrorBoundary";

function Bomb({ message }: { message: string }): never {
  throw new Error(message);
}

describe("RouteErrorBoundary", () => {
  beforeEach(() => {
    // The boundary logs the caught error, and React logs it a second time;
    // neither is useful test output.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders its children when nothing throws", () => {
    render(
      <MemoryRouter>
        <RouteErrorBoundary>
          <div>All good</div>
        </RouteErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("shows a generic fallback for an ordinary render error", () => {
    render(
      <MemoryRouter>
        <RouteErrorBoundary>
          <Bomb message="boom" />
        </RouteErrorBoundary>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Something went wrong" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go home" })).toBeInTheDocument();
  });

  it("shows an update-available fallback for a chunk-loading error", () => {
    render(
      <MemoryRouter>
        <RouteErrorBoundary>
          <Bomb message="Loading chunk 4 failed" />
        </RouteErrorBoundary>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "A new version is available" }),
    ).toBeInTheDocument();
  });

  it("clears the error once the user navigates away via the fallback's own link", async () => {
    // The boundary sits above <Routes>, so the only way to navigate while the
    // crashed subtree is showing the fallback is through a link that is part
    // of the fallback UI itself — exactly what "Go home" is for.
    render(
      <MemoryRouter initialEntries={["/a"]} useTransitions={false}>
        <RouteErrorBoundary>
          <Routes>
            <Route path="/a" element={<Bomb message="boom" />} />
            <Route path="/" element={<div>Home page</div>} />
          </Routes>
        </RouteErrorBoundary>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Something went wrong" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Go home" }));

    expect(await screen.findByText("Home page")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Something went wrong" }),
    ).not.toBeInTheDocument();
  });

  it("treats a failed Vite preload as a chunk error whatever the message says", () => {
    window.dispatchEvent(new Event("vite:preloadError"));

    render(
      <MemoryRouter>
        <RouteErrorBoundary>
          <Bomb message="boom" />
        </RouteErrorBoundary>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "A new version is available" }),
    ).toBeInTheDocument();
  });

  it("forgets a preload failure once it has been reported", () => {
    window.dispatchEvent(new Event("vite:preloadError"));
    const { unmount } = render(
      <MemoryRouter>
        <RouteErrorBoundary>
          <Bomb message="first" />
        </RouteErrorBoundary>
      </MemoryRouter>,
    );
    unmount();

    render(
      <MemoryRouter>
        <RouteErrorBoundary>
          <Bomb message="second" />
        </RouteErrorBoundary>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Something went wrong" }),
    ).toBeInTheDocument();
  });

  it("reloads the page from the fallback", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    render(
      <MemoryRouter>
        <RouteErrorBoundary>
          <Bomb message="boom" />
        </RouteErrorBoundary>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reload" }));

    expect(reload).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  describe("error details", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("shows the error message during development", () => {
      vi.stubEnv("DEV", true);

      render(
        <MemoryRouter>
          <RouteErrorBoundary>
            <Bomb message="secret detail" />
          </RouteErrorBoundary>
        </MemoryRouter>,
      );

      expect(screen.getByText("secret detail")).toBeInTheDocument();
    });

    it("hides the error message in production", () => {
      vi.stubEnv("DEV", false);

      render(
        <MemoryRouter>
          <RouteErrorBoundary>
            <Bomb message="secret detail" />
          </RouteErrorBoundary>
        </MemoryRouter>,
      );

      expect(screen.queryByText("secret detail")).not.toBeInTheDocument();
    });
  });

  it("can be loaded where there is no window", async () => {
    vi.resetModules();
    vi.stubGlobal("window", undefined);

    await expect(import("./RouteErrorBoundary")).resolves.toHaveProperty(
      "RouteErrorBoundary",
    );

    vi.unstubAllGlobals();
  });
});
