import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { expectNoA11yViolations } from "@/test/axe";
import { makeUser } from "@/test/fixtures";
import { renderWithStore } from "@/test/render-with-store";
import ProfileDetailsPage from "./ProfileDetailsPage";

const sessions = vi.hoisted(() => vi.fn());

vi.mock("@/api/auth", () => ({ authApi: { sessions } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

async function renderPage(user = makeUser()) {
  sessions.mockResolvedValue([]);
  const view = renderWithStore(<ProfileDetailsPage />, { auth: { user } });
  await waitFor(() =>
    expect(view.store.getState().auth.isSessionsLoading).toBe(false),
  );
  return view;
}

describe("ProfileDetailsPage", () => {
  beforeEach(() => {
    sessions.mockReset();
  });

  it("introduces the account", async () => {
    await renderPage();

    expect(
      screen.getByRole("heading", { name: "My account" }),
    ).toBeInTheDocument();
  });

  it("shows who the user is", async () => {
    await renderPage(makeUser({ role: { id: "r1", name: "Owner" } as never }));

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("PLATFORM_ADMIN")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("555-0100")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
  });

  it("shows a dash when the user has no role", async () => {
    await renderPage();

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("says when the password was last changed", async () => {
    await renderPage(
      makeUser({
        passwordUpdatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      }),
    );

    expect(screen.getByText("3 hours ago")).toBeInTheDocument();
  });

  it("shows two-factor authentication as disabled with an option to enable it", async () => {
    await renderPage(makeUser({ twoFactorEnabled: false }));

    expect(screen.getByText("Disabled")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enable" })).toBeInTheDocument();
  });

  it("shows two-factor authentication as enabled with an option to disable it", async () => {
    await renderPage(makeUser({ twoFactorEnabled: true }));

    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disable" })).toBeInTheDocument();
  });

  it("offers the account actions", async () => {
    await renderPage();

    expect(
      screen.getByRole("button", { name: "Edit profile" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Change Password" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Active sessions" }),
    ).toBeInTheDocument();
  });

  it("holds back the profile actions until the user has loaded", async () => {
    sessions.mockResolvedValue([]);
    renderWithStore(<ProfileDetailsPage />, { auth: { user: null } });

    expect(
      screen.queryByRole("button", { name: "Edit profile" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Enable" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = await renderPage();

    await expectNoA11yViolations(container);
  });
});
