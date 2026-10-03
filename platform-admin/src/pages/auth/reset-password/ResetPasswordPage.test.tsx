import { fireEvent, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import authReducer from "@/store/auth/authSlice";
import { expectNoA11yViolations } from "@/test/axe";
import ResetPasswordPage from "./ResetPasswordPage";

const resetForgottenPassword = vi.hoisted(() => vi.fn());

vi.mock("@/api/auth", () => ({ authApi: { resetForgottenPassword } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const email = "jane@example.com";
const validPassword = "new-password-1";

function Destination({ label }: { label: string }) {
  const { pathname, search } = useLocation();
  return (
    <div>
      {label}
      <span data-testid="url">{`${pathname}${search}`}</span>
    </div>
  );
}

function renderPage(state: unknown = { email, resetToken: "tok" }) {
  const store = configureStore({ reducer: { auth: authReducer } });

  render(
    <Provider store={store}>
      <MemoryRouter
        initialEntries={[{ pathname: "/auth/reset-password", state }]}
        useTransitions={false}
      >
        <Routes>
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/auth/forgot-password"
            element={<Destination label="Forgot password page" />}
          />
          <Route
            path="/auth/login"
            element={<Destination label="Login page" />}
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

const passwordInput = () => screen.getByLabelText("Password");
const confirmInput = () => screen.getByLabelText("Confirm Password");
const submitButton = () =>
  screen.getByRole("button", { name: "Reset Password" });

const type = (input: HTMLElement, value: string) =>
  fireEvent.change(input, { target: { value } });

const fillAndSubmit = (password = validPassword, confirm = password) => {
  type(passwordInput(), password);
  type(confirmInput(), confirm);
  fireEvent.click(submitButton());
};

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    resetForgottenPassword.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  describe("rendering", () => {
    it("renders the form for the email from the session", () => {
      renderPage();

      expect(
        screen.getByRole("heading", { name: "Set a new Password" }),
      ).toBeInTheDocument();
      expect(screen.getByText(email)).toBeInTheDocument();
      expect(passwordInput()).toHaveAttribute("type", "password");
      expect(confirmInput()).toHaveAttribute("type", "password");
      expect(submitButton()).toBeEnabled();
    });

    it("goes back to forgot password when the session is missing", () => {
      renderPage(null);

      expect(screen.getByText("Forgot password page")).toBeInTheDocument();
    });

    it("links back to sign in", () => {
      renderPage();

      fireEvent.click(screen.getByRole("link", { name: "Back to sign in" }));

      expect(screen.getByText("Login page")).toBeInTheDocument();
      expect(screen.getByTestId("url")).toHaveTextContent("/auth/login");
    });

    it("keeps the return path in the sign-in link", () => {
      renderPage({ email, resetToken: "tok", redirectTo: "/orders" });

      fireEvent.click(screen.getByRole("link", { name: "Back to sign in" }));

      expect(screen.getByTestId("url")).toHaveTextContent(
        "/auth/login?redirect_uri=%2Forders",
      );
    });

    it("toggles password visibility", () => {
      renderPage();

      fireEvent.click(
        screen.getAllByRole("button", { name: "Show password" })[0],
      );

      expect(passwordInput()).toHaveAttribute("type", "text");
    });
  });

  describe("validation", () => {
    it("requires both fields and does not call the api", () => {
      renderPage();

      fireEvent.click(submitButton());

      expect(screen.getByText("Password is required")).toBeInTheDocument();
      expect(screen.getByText("Confirm your password")).toBeInTheDocument();
      expect(passwordInput()).toHaveAttribute("aria-invalid", "true");
      expect(confirmInput()).toHaveAttribute("aria-invalid", "true");
      expect(resetForgottenPassword).not.toHaveBeenCalled();
    });

    it("rejects a password that is too short", () => {
      renderPage();

      fillAndSubmit("short");

      expect(
        screen.getByText("Password must be at least 8 characters"),
      ).toBeInTheDocument();
      expect(resetForgottenPassword).not.toHaveBeenCalled();
    });

    it("rejects mismatching passwords", () => {
      renderPage();

      fillAndSubmit(validPassword, "another-password-2");

      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
      expect(confirmInput()).toHaveAttribute("aria-invalid", "true");
      expect(resetForgottenPassword).not.toHaveBeenCalled();
    });

    it("flags a mismatch while the confirmation is being typed", () => {
      renderPage();

      type(passwordInput(), validPassword);
      type(confirmInput(), "different");

      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });

    it("clears a field error as soon as that field is edited", () => {
      renderPage();
      fireEvent.click(submitButton());

      type(passwordInput(), "p");

      expect(
        screen.queryByText("Password is required"),
      ).not.toBeInTheDocument();
      expect(passwordInput()).toHaveAttribute("aria-invalid", "false");
      expect(screen.getByText("Confirm your password")).toBeInTheDocument();
    });
  });

  describe("submitting", () => {
    it("resets the password and shows the success screen", async () => {
      resetForgottenPassword.mockResolvedValue({
        success: true,
        message: "Password changed",
      });
      renderPage();

      fillAndSubmit();

      expect(
        await screen.findByRole("heading", { name: "Password Updated" }),
      ).toBeInTheDocument();
      expect(resetForgottenPassword).toHaveBeenCalledWith({
        password: validPassword,
        resetToken: "tok",
      });
      expect(toast.success).toHaveBeenCalledWith("Password changed");
      expect(toast.error).not.toHaveBeenCalled();
    });

    it("leads back to sign in from the success screen, keeping the return path", async () => {
      resetForgottenPassword.mockResolvedValue({
        success: true,
        message: "ok",
      });
      renderPage({ email, resetToken: "tok", redirectTo: "/orders" });

      fillAndSubmit();
      await screen.findByRole("heading", { name: "Password Updated" });
      fireEvent.click(screen.getByRole("link", { name: "Back to sign in" }));

      expect(await screen.findByTestId("url")).toHaveTextContent(
        "/auth/login?redirect_uri=%2Forders",
      );
    });

    it("shows the error inline and as a toast when the request fails", async () => {
      resetForgottenPassword.mockRejectedValue(new Error("network down"));
      renderPage();

      fillAndSubmit();

      expect(
        await screen.findByText("Failed to reset password"),
      ).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith("Failed to reset password");
      expect(toast.success).not.toHaveBeenCalled();
      expect(
        screen.getByRole("heading", { name: "Set a new Password" }),
      ).toBeInTheDocument();
      expect(submitButton()).toBeEnabled();
    });

    it("disables the form and shows progress while updating", async () => {
      let resolveRequest: (value: unknown) => void = () => {};
      resetForgottenPassword.mockReturnValue(
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
      );
      renderPage();

      fillAndSubmit();

      const busyButton = await screen.findByRole("button", {
        name: /Updating/,
      });
      expect(busyButton).toBeDisabled();
      expect(passwordInput()).toBeDisabled();
      expect(confirmInput()).toBeDisabled();

      resolveRequest({ success: true, message: "ok" });
      expect(
        await screen.findByRole("heading", { name: "Password Updated" }),
      ).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("sets a descriptive document title", () => {
      renderPage();

      expect(document.title).toBe("Set a new password | Platform Admin");
    });

    it("marks both fields as required", () => {
      renderPage();

      expect(passwordInput()).toBeRequired();
      expect(confirmInput()).toBeRequired();
    });

    it("ties each invalid field to its error message", () => {
      renderPage();

      fireEvent.click(submitButton());

      expect(passwordInput()).toHaveAccessibleDescription(
        "Password is required",
      );
      expect(confirmInput()).toHaveAccessibleDescription(
        "Confirm your password",
      );
    });

    it("describes the confirmation by the mismatch while typing", () => {
      renderPage();

      type(passwordInput(), validPassword);
      type(confirmInput(), "different");

      expect(confirmInput()).toHaveAccessibleDescription(
        "Passwords don't match",
      );
    });

    it("announces a request failure as an alert", async () => {
      resetForgottenPassword.mockRejectedValue(new Error("network down"));
      renderPage();

      fillAndSubmit();

      expect(
        await screen.findByText("Failed to reset password"),
      ).toHaveAttribute("role", "alert");
    });

    it("moves focus to the success heading and updates the title once the password is reset", async () => {
      resetForgottenPassword.mockResolvedValue({
        success: true,
        message: "ok",
      });
      renderPage();

      fillAndSubmit();

      const heading = await screen.findByRole("heading", {
        name: "Password Updated",
      });
      expect(heading).toHaveFocus();
      expect(document.title).toBe("Password updated | Platform Admin");
    });

    it("has no axe violations on the form, with errors, while updating and on the success screen", async () => {
      renderPage();
      await expectNoA11yViolations();

      fireEvent.click(submitButton());
      await expectNoA11yViolations();

      let resolveRequest: (value: unknown) => void = () => {};
      resetForgottenPassword.mockReturnValue(
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
      );
      fillAndSubmit();
      await screen.findByRole("button", { name: /Updating/ });
      await expectNoA11yViolations();

      resolveRequest({ success: true, message: "ok" });
      await screen.findByRole("heading", { name: "Password Updated" });
      await expectNoA11yViolations();
    });
  });
});
