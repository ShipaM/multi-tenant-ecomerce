import { test, expect } from "../support/fixtures";
import { adminUser, currentSession } from "../support/test-data";

test.describe("My account", () => {
  test.beforeEach(async ({ page, signedIn }) => {
    void signedIn;
    await page.goto("/dashboard/my-account");
    await expect(
      page.getByRole("heading", { name: "My account" }),
    ).toBeVisible();
  });

  test("Shows the profile, role, and 2FA status", async ({ page }) => {
    await expect(page.getByText(adminUser.fullName).first()).toBeVisible();
    await expect(page.getByText(adminUser.phone)).toBeVisible();
    await expect(page.getByText("Super admin")).toBeVisible();
    await expect(page.getByText("Disabled")).toBeVisible();
  });

  test("Profile editing: 'Save' is disabled without changes, then sends a PUT request and updates the UI", async ({
    page,
    api,
  }) => {
    api.on("PUT", "/users/me", (req) => ({
      json: {
        success: true,
        message: "Profile updated",
        user: { ...adminUser, ...(req.body as Record<string, unknown>) },
      },
    }));
    await page.getByRole("button", { name: "Edit profile" }).click();
    const dialog = page.getByRole("dialog");
    const save = dialog.getByRole("button", { name: "Save changes" });
    await expect(save).toBeDisabled();
    await dialog.getByLabel("Full name").fill("Renamed Admin");
    await expect(save).toBeEnabled();
    await save.click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Renamed Admin").first()).toBeVisible();
    expect(api.callsTo("PUT", "/users/me")[0].body).toMatchObject({
      fullName: "Renamed Admin",
      email: adminUser.email,
    });
  });

  test("Profile: email already exists (409) — an error is shown in the dialog, and the dialog stays open", async ({
    page,
    api,
  }) => {
    api.on("PUT", "/users/me", {
      status: 409,
      json: { statusCode: 409, message: "Email is already taken" },
    });
    await page.getByRole("button", { name: "Edit profile" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Email").fill("busy@platform.test");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(dialog.getByText("Email is already taken")).toBeVisible();
  });

  test("Change password: a password mismatch disables the button, and success closes the dialog", async ({
    page,
    api,
  }) => {
    api.on("PUT", "/users/change-password", {
      json: {
        success: true,
        message: "Password changed successfully",
        user: adminUser,
      },
    });
    await page.getByRole("button", { name: "Change Password" }).click();
    const dialog = page.getByRole("dialog");
    const save = dialog.getByRole("button", { name: "Save changes" });
    await dialog
      .getByLabel("Current Password", { exact: true })
      .fill("OldPassword1");
    await dialog
      .getByLabel("New Password", { exact: true })
      .fill("NewPassword1");
    await dialog
      .getByLabel("Confirm Password", { exact: true })
      .fill("Mismatch1234");
    await expect(save).toBeDisabled();
    await dialog
      .getByLabel("Confirm Password", { exact: true })
      .fill("NewPassword1");
    await expect(save).toBeEnabled();
    await save.click();
    await expect(dialog).toBeHidden();
    expect(api.callsTo("PUT", "/users/change-password")[0].body).toEqual({
      currentPassword: "OldPassword1",
      password: "NewPassword1",
    });
  });

  test("Enable 2FA: Send OTP → enter the code → 'Enabled' badge", async ({
    page,
    api,
  }) => {
    api
      .on("POST", "/auth/2fa-generate-otp", {
        json: { success: true, message: "Code sent" },
      })
      .on("POST", "/auth/2fa-verify-enable", {
        json: {
          success: true,
          message: "2FA enabled",
          data: { twoFactorEnabled: true },
        },
      });
    await page.getByRole("button", { name: "Enable" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Send OTP" }).click();
    await dialog.getByLabel("OTP", { exact: true }).fill("123456");
    await dialog.getByRole("button", { name: "Verify OTP" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Enabled", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Disable" })).toBeVisible();
    expect(api.callsTo("POST", "/auth/2fa-verify-enable")[0].body).toEqual({
      otp: "123456",
    });
  });

  test("Active sessions: list, revoke another session, and log out of all other sessions", async ({
    page,
    api,
  }) => {
    await expect(page.getByText("2 devices signed in")).toBeVisible();
    await expect(page.getByText("macOS/Chrome")).toBeVisible();
    await expect(page.getByText("This device")).toBeVisible();
    // After revoking a session, the SPA fetches the list again — only the current session is returned.
    api
      .on("POST", "/auth/sessions/session-other/revoke", {
        json: { success: true },
      })
      .on("GET", "/auth/sessions", { json: [currentSession] });
    await page.getByRole("button", { name: "Revoke" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Confirm" })
      .click();
    await expect(page.getByText("1 device signed in")).toBeVisible();
    expect(
      api.callsTo("POST", "/auth/sessions/session-other/revoke"),
    ).toHaveLength(1);
    api.on("POST", "/auth/sessions/revoke-others", { json: { success: true } });
    await page
      .getByRole("button", { name: "Sign out all other sessions" })
      .click();
    await expect(page.getByText("Other sessions signed out")).toBeVisible();
    expect(api.callsTo("POST", "/auth/sessions/revoke-others")).toHaveLength(1);
  });
});
