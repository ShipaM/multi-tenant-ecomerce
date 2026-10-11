import { test, expect } from "../support/fixtures";
import { LoginPage } from "../support/login-page";
import { adminUser, tokens } from "../support/test-data";

test.describe("Route protection and session handling", () => {
  test("Guest on /dashboard is redirected to the login page", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/auth/login");
  });

  test("Guest on a deep link: the path is saved in redirect_uri and works after login.", async ({
    page,
    api,
  }) => {
    api
      .on("POST", "/auth/login", { json: tokens })
      .on("GET", "/auth/me", { json: adminUser });
    await page.goto("/dashboard/orders");
    await expect(page).toHaveURL(
      "/auth/login?redirect_uri=%2Fdashboard%2Forders",
    );
    await new LoginPage(page).signIn("admin@platform.test", "Password123!");
    await expect(page).toHaveURL("/dashboard/orders");
  });

  test("An unsafe redirect_uri is ignored", async ({ page, api }) => {
    api
      .on("POST", "/auth/login", { json: tokens })
      .on("GET", "/auth/me", { json: adminUser });
    const login = new LoginPage(page);
    await login.goto("?redirect_uri=//evil.example.com");
    await login.signIn("admin@platform.test", "Password123!");
    await expect(page).toHaveURL("/dashboard");
  });

  test("An authenticated user on the login page is redirected to the dashboard.", async ({
    page,
    signedIn,
  }) => {
    void signedIn;
    await page.goto("/auth/login");
    await expect(page).toHaveURL("/dashboard");
  });

  test("A non-existent URL shows a 404 page.", async ({ page }) => {
    await page.goto("/no/such/page");
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Go home" }).click();
    await expect(page).toHaveURL("/auth/login");
  });

  test("Expired access token: the SPA refreshes both tokens and retries the request", async ({
    page,
    api,
    signedIn,
  }) => {
    void signedIn;
    let meCalls = 0;
    api
      .on("GET", "/auth/me", () => {
        meCalls += 1;
        return meCalls === 1
          ? { status: 401, json: { message: "Unauthorized" } }
          : { json: adminUser };
      })
      .on("POST", "/auth/refresh", {
        json: { accessToken: "new-access", refreshToken: "new-refresh" },
      });
    await page.goto("/dashboard");
    await expect(page.getByText(adminUser.email).first()).toBeVisible();
    expect(
      await page.evaluate(() => localStorage.getItem("ACCESS_TOKEN")),
    ).toBe("new-access");
    expect(api.callsTo("GET", "/auth/me").at(-1)?.headers.authorization).toBe(
      "Bearer new-access",
    );
  });

  test("Refresh token rejected: storage is cleared and the user is redirected to the login page", async ({
    page,
    api,
    signedIn,
  }) => {
    void signedIn;
    api
      .on("GET", "/auth/me", { status: 401, json: { message: "Unauthorized" } })
      .on("POST", "/auth/refresh", {
        status: 401,
        json: { message: "Invalid refresh token" },
      });
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
    expect(
      await page.evaluate(() => localStorage.getItem("ACCESS_TOKEN")),
    ).toBeNull();
    expect(
      await page.evaluate(() => localStorage.getItem("REFRESH_TOKEN")),
    ).toBeNull();
  });
});
