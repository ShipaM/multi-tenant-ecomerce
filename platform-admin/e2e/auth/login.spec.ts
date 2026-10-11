import { test, expect } from "../support/fixtures";
import { LoginPage } from "../support/login-page";
import { adminUser, tokens } from "../support/test-data";

test.describe("Login", () => {
  test("The root URL redirects to the login page.", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/auth/login");
    await expect(new LoginPage(page).heading).toBeVisible();
  });

  test("An empty form shows validation errors and does not send a request.", async ({
    page,
    api,
  }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.submit.click();
    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
    expect(api.callsTo("POST", "/auth/login")).toHaveLength(0);
  });

  test("An invalid email is rejected on the client.", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn("not-an-email", "whatever");
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
  });

  test("Successful login: tokens are stored in localStorage and the user is redirected to the dashboard.", async ({
    page,
    api,
  }) => {
    api
      .on("POST", "/auth/login", { json: tokens })
      .on("GET", "/auth/me", { json: adminUser });
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn("admin@platform.test", "Password123!");
    await expect(page).toHaveURL("/dashboard");
    expect(api.callsTo("POST", "/auth/login")[0].body).toEqual({
      email: "admin@platform.test",
      password: "Password123!",
    });
    expect(
      await page.evaluate(() => localStorage.getItem("ACCESS_TOKEN")),
    ).toBe(tokens.accessToken);
  });

  test("Wrong password: the server error message is shown in the form.", async ({
    page,
    api,
  }) => {
    api.on("POST", "/auth/login", {
      status: 401,
      json: { statusCode: 401, message: "Invalid email or password" },
    });
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn("admin@platform.test", "wrong-password");
    await expect(
      login.form.getByText("Invalid email or password"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
    expect(
      await page.evaluate(() => localStorage.getItem("ACCESS_TOKEN")),
    ).toBeNull();
  });

  test("The 'eye' button shows and hides the password", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.password.fill("secret");
    await expect(login.password).toHaveAttribute("type", "password");
    // The button keeps its label and reports its state through aria-pressed.
    const toggle = page.getByRole("button", { name: "Show password" });
    await toggle.click();
    await expect(login.password).toHaveAttribute("type", "text");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await toggle.click();
    await expect(login.password).toHaveAttribute("type", "password");
  });

  test("2FA login: enter the code from the email first, then go to the dashboard.", async ({
    page,
    api,
  }) => {
    api
      .on("POST", "/auth/login", {
        json: {
          twoFactorRequired: true,
          twoFactorToken: "2fa-token",
          message: "Code sent",
        },
      })
      .on("POST", "/auth/2fa-verify-login-otp", { json: tokens })
      .on("GET", "/auth/me", { json: adminUser });
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn("admin@platform.test", "Password123!");
    await expect(page).toHaveURL("/auth/2fa");
    await expect(page.getByText("admin@platform.test")).toBeVisible();
    await page.getByLabel("One-time passcode").fill("123456");
    await page.getByRole("button", { name: "Verify 2FA OTP" }).click();
    await expect(page).toHaveURL("/dashboard");
    expect(api.callsTo("POST", "/auth/2fa-verify-login-otp")[0].body).toEqual({
      twoFactorToken: "2fa-token",
      otp: "123456",
    });
  });

  test("Invalid 2FA code: an error is shown and the user stays on the page", async ({
    page,
    api,
  }) => {
    api
      .on("POST", "/auth/login", {
        json: {
          twoFactorRequired: true,
          twoFactorToken: "2fa-token",
          message: "Code sent",
        },
      })
      .on("POST", "/auth/2fa-verify-login-otp", {
        status: 400,
        json: { statusCode: 400, message: "Otp expired or invalid" },
      });
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn("admin@platform.test", "Password123!");
    await page.getByLabel("One-time passcode").fill("000000");
    await page.getByRole("button", { name: "Verify 2FA OTP" }).click();
    await expect(page.getByText("Otp expired or invalid")).toBeVisible();
    await expect(page).toHaveURL("/auth/2fa");
  });

  test("Opening the 2FA page directly (without the token from the login step) redirects to login", async ({
    page,
  }) => {
    // The token lives only in router state (history.state), so a fresh navigation has none.
    await page.goto("/auth/2fa");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
