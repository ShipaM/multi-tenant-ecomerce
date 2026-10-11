import { test, expect } from "../support/fixtures";
import { NOW } from "../support/test-data";

const EMAIL = "admin@platform.test";

const mockForgotChain = (api: import("../support/api-mock").ApiMock) =>
  api
    .on("POST", "/auth/forgot-password", {
      json: {
        success: true,
        message: "Code sent",
        data: { createdAt: NOW.toISOString() },
      },
    })
    .on("POST", "/auth/forgot-password/verify-otp", {
      json: {
        success: true,
        message: "Code accepted",
        data: { resetToken: "reset-token" },
      },
    })
    .on("POST", "/auth/reset-password", {
      json: {
        success: true,
        message: "Password changed successfully",
        user: {},
      },
    });

test.describe("Password recovery", () => {
  test("Full flow: email → code → new password → 'Password Updated' screen.", async ({
    page,
    api,
  }) => {
    mockForgotChain(api);
    await page.goto("/auth/login");
    await page.getByRole("link", { name: "Forgot Password?" }).click();
    await expect(page).toHaveURL("/auth/forgot-password");
    await page.getByLabel("Email Address").fill(EMAIL);
    await page.getByRole("button", { name: "Send OTP" }).click();
    await expect(page).toHaveURL("/auth/forgot-password/otp");
    await expect(page.getByText(EMAIL)).toBeVisible();
    await page.getByLabel("One-time passcode").fill("654321");
    await page.getByRole("button", { name: "Verify OTP" }).click();
    await expect(page).toHaveURL("/auth/reset-password");
    await page.getByLabel("Password", { exact: true }).fill("NewPassword123");
    await page
      .getByLabel("Confirm Password", { exact: true })
      .fill("NewPassword123");
    await page.getByRole("button", { name: "Reset Password" }).click();
    await expect(
      page.getByRole("heading", { name: "Password Updated" }),
    ).toBeVisible();
    expect(
      api.callsTo("POST", "/auth/forgot-password/verify-otp")[0].body,
    ).toEqual({
      email: EMAIL,
      otp: "654321",
    });
    expect(api.callsTo("POST", "/auth/reset-password")[0].body).toEqual({
      password: "NewPassword123",
      resetToken: "reset-token",
    });
    await page.getByRole("link", { name: "Back to sign in" }).click();
    await expect(page).toHaveURL("/auth/login");
  });

  test("Invalid email is not submitted.", async ({ page, api }) => {
    await page.goto("/auth/forgot-password");
    await page.getByLabel("Email Address").fill("nope");
    await page.getByRole("button", { name: "Send OTP" }).click();
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    expect(api.callsTo("POST", "/auth/forgot-password")).toHaveLength(0);
  });

  test("Passwords do not match: an error is shown and the request is not sent", async ({
    page,
    api,
  }) => {
    mockForgotChain(api);
    await page.goto("/auth/forgot-password");
    await page.getByLabel("Email Address").fill(EMAIL);
    await page.getByRole("button", { name: "Send OTP" }).click();
    await page.getByLabel("One-time passcode").fill("654321");
    await page.getByRole("button", { name: "Verify OTP" }).click();
    await page.getByLabel("Password", { exact: true }).fill("NewPassword123");
    await page
      .getByLabel("Confirm Password", { exact: true })
      .fill("Different123");
    await page.getByRole("button", { name: "Reset Password" }).click();
    await expect(page.getByText("Passwords don't match")).toBeVisible();
    expect(api.callsTo("POST", "/auth/reset-password")).toHaveLength(0);
  });

  test("New password is too short.", async ({ page, api }) => {
    mockForgotChain(api);
    await page.goto("/auth/forgot-password");
    await page.getByLabel("Email Address").fill(EMAIL);
    await page.getByRole("button", { name: "Send OTP" }).click();
    await page.getByLabel("One-time passcode").fill("654321");
    await page.getByRole("button", { name: "Verify OTP" }).click();
    await page.getByLabel("Password", { exact: true }).fill("short");
    await page.getByLabel("Confirm Password", { exact: true }).fill("short");
    await page.getByRole("button", { name: "Reset Password" }).click();
    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible();
  });

  test("Invalid code: the server error is shown and the user stays on the code step", async ({
    page,
    api,
  }) => {
    mockForgotChain(api);
    api.on("POST", "/auth/forgot-password/verify-otp", {
      status: 400,
      json: { statusCode: 400, message: "Otp expired or invalid" },
    });
    await page.goto("/auth/forgot-password");
    await page.getByLabel("Email Address").fill(EMAIL);
    await page.getByRole("button", { name: "Send OTP" }).click();
    await page.getByLabel("One-time passcode").fill("000000");
    await page.getByRole("button", { name: "Verify OTP" }).click();
    await expect(
      page.getByText("Otp expired or invalid").first(),
    ).toBeVisible();
    await expect(page).toHaveURL("/auth/forgot-password/otp");
  });

  test("Direct access to a step without completing the previous step redirects back", async ({
    page,
  }) => {
    await page.goto("/auth/forgot-password/otp");
    await expect(page).toHaveURL("/auth/forgot-password");
    await page.goto("/auth/reset-password");
    await expect(page).toHaveURL("/auth/forgot-password");
  });

  test("The code is valid for 5 minutes: a timer is shown, then the 'Resend OTP' button appears.", async ({
    page,
    api,
  }) => {
    mockForgotChain(api);
    // Set the browser time BEFORE loading the page so we can control the timer
    await page.clock.install({ time: NOW });
    await page.goto("/auth/forgot-password");
    await page.getByLabel("Email Address").fill(EMAIL);
    await page.getByRole("button", { name: "Send OTP" }).click();
    await expect(page.getByText(/OTP will expire in 0[45]:\d\d/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Resend Otp" })).toHaveCount(
      0,
    );
    await page.clock.fastForward("05:01");
    await expect(
      page.getByRole("button", { name: "Resend Otp" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Resend Otp" }).click();
    expect(api.callsTo("POST", "/auth/forgot-password")).toHaveLength(2);
  });
});
