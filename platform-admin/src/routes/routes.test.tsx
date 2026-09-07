import { render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import App from "@/App";

const SIGN_IN = "Sign In";
const NOT_FOUND = "Page not found";

function renderAt(path: string) {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[path]} useTransitions={false}>
        <App />
      </MemoryRouter>
    </StrictMode>,
  );
}

function findHeadings(name: string) {
  return screen.findAllByRole("heading", { name });
}

describe("AppRoutes", () => {
  it("renders the sign-in page exactly once on /auth/login", async () => {
    renderAt("/auth/login");

    expect(await findHeadings(SIGN_IN)).toHaveLength(1);
  });

  it("redirects / to the sign-in page", async () => {
    renderAt("/");

    expect(await findHeadings(SIGN_IN)).toHaveLength(1);
  });

  it("redirects a bare /auth to the sign-in page", async () => {
    renderAt("/auth");

    expect(await findHeadings(SIGN_IN)).toHaveLength(1);
  });

  it("treats /auth/login/ as the same route as /auth/login", async () => {
    renderAt("/auth/login/");

    expect(await findHeadings(SIGN_IN)).toHaveLength(1);
  });

  it.each([
    ["/auth/forgot-password", "Forgot Password"],
    ["/auth/forgot-password/otp", "Enter Verification otp"],
    ["/auth/reset-password", "Set a new Password"],
  ])("renders %s exactly once", async (path, heading) => {
    renderAt(path);

    expect(await findHeadings(heading)).toHaveLength(1);
  });

  it("renders 404 on an unknown path", async () => {
    renderAt("/no/such/page");

    expect(await findHeadings(NOT_FOUND)).toHaveLength(1);
    expect(
      screen.queryByRole("heading", { name: SIGN_IN }),
    ).not.toBeInTheDocument();
  });

  it.each(["/login", "/auth/login/extra"])(
    "does not answer with the sign-in page on %s",
    async (path) => {
      renderAt(path);

      expect(
        await screen.findByRole("heading", { name: NOT_FOUND }),
      ).toBeInTheDocument();
    },
  );

  it("wraps the routes in a single <main> landmark", async () => {
    renderAt("/auth/login");
    await findHeadings(SIGN_IN);

    expect(screen.getAllByRole("main")).toHaveLength(1);
  });
});
