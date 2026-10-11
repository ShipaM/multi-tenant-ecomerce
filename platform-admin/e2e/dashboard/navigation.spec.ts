import { test, expect } from "../support/fixtures";
import { adminUser, sidebarItems } from "../support/test-data";

test.describe("Dashboard: navigation and logout", () => {
  test.beforeEach(async ({ signedIn }) => {
    void signedIn;
  });

  test("After loading, the sidebar and user data are visible", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.getByAltText("Platform Admin Logo")).toBeVisible();
    await expect(page.getByText(adminUser.fullName).first()).toBeVisible();
    await expect(page.getByText(adminUser.email).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
  for (const [label, href] of sidebarItems) {
    test(`пункт меню «${label}» открывает ${href}`, async ({ page }) => {
      await page.goto("/dashboard");
      await page.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(href);
      await expect(page.getByRole("link", { name: label })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });
  }

  test("The account menu opens the 'My account' page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("link", { name: "My Account" }).click();
    await expect(page).toHaveURL("/dashboard/my-account");
    await expect(
      page.getByRole("heading", { name: "My account" }),
    ).toBeVisible();
  });

  test("Logout: sends a logout request, clears tokens, and redirects to the login page", async ({
    page,
    api,
  }) => {
    api.on("POST", "/auth/logout", { json: { success: true } });
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL("/auth/login");
    expect(api.callsTo("POST", "/auth/logout")).toHaveLength(1);
    expect(
      await page.evaluate(() => localStorage.getItem("ACCESS_TOKEN")),
    ).toBeNull();
    // After reload, the user is still logged out (the init script will not restore the tokens)
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/auth/login");
  });
});
