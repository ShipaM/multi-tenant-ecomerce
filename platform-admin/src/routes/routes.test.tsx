import { render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import App from "@/App";

/**
 * We render <App>, not <AppRoutes>: the composition of boundary + Suspense +
 * <main> around the routes is part of the contract, and one of the bugs
 * caught in review (the router rendering twice) lived in App itself.
 *
 * StrictMode mirrors main.tsx — the doubled render and effects catch impure
 * effects in RootRedirect and useScrollToTop.
 * useTransitions={false} mirrors the production config too.
 */
function renderAt(path: string) {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[path]} useTransitions={false}>
        <App />
      </MemoryRouter>
    </StrictMode>,
  );
}

describe("AppRoutes", () => {
  it("renders the login page exactly once on /auth/login", async () => {
    renderAt("/auth/login");

    // findAllBy + length 1: a plain getBy would pass on a double render too.
    expect(await screen.findAllByText("LoginPage")).toHaveLength(1);
  });

  it("redirects / to the login page", async () => {
    renderAt("/");

    expect(await screen.findAllByText("LoginPage")).toHaveLength(1);
  });

  it("renders 404 on an unknown path", async () => {
    renderAt("/no/such/page");

    expect(
      await screen.findAllByRole("heading", { name: "Page not found" }),
    ).toHaveLength(1);
    expect(screen.queryByText("LoginPage")).not.toBeInTheDocument();
  });

  it("redirects a bare /auth to the login page", async () => {
    renderAt("/auth");

    expect(await screen.findAllByText("LoginPage")).toHaveLength(1);
  });

  // The login page has exactly one canonical URL. Catches a duplicate flat
  // /login coming back.
  it.each(["/login", "/auth/login/extra"])(
    "does not answer with the login page on %s",
    async (path) => {
      renderAt(path);

      expect(
        await screen.findByRole("heading", { name: "Page not found" }),
      ).toBeInTheDocument();
    },
  );

  // A trailing slash is not a separate URL: react-router normalises it to the
  // same route. Pinned as expected behaviour so it is not mistaken for a dupe.
  it("treats /auth/login/ as the same route as /auth/login", async () => {
    renderAt("/auth/login/");

    expect(await screen.findAllByText("LoginPage")).toHaveLength(1);
  });

  it("wraps the routes in a single <main> landmark", async () => {
    renderAt("/auth/login");
    await screen.findByText("LoginPage");

    expect(screen.getAllByRole("main")).toHaveLength(1);
  });
});
