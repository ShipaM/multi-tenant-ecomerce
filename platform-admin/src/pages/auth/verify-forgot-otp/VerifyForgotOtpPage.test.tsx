import { fireEvent, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import authReducer from "@/store/auth/authSlice";
import VerifyForgotOtpPage from "./VerifyForgotOtpPage";

const forgotPassword = vi.hoisted(() => vi.fn());
const forgotPasswordOtpVerify = vi.hoisted(() => vi.fn());

vi.mock("@/api/auth", () => ({
  authApi: { forgotPassword, forgotPasswordOtpVerify },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const email = "jane@example.com";
const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

const verifyResponse = {
  success: true,
  message: "Verified",
  data: { resetToken: "tok" },
};
const resendResponse = () => ({
  success: true,
  message: "OTP sent",
  data: { createdAt: new Date().toISOString() },
});

function Destination({ label }: { label: string }) {
  const { pathname, search, state } = useLocation();
  return (
    <div>
      {label}
      <span data-testid="url">{`${pathname}${search}`}</span>
      <span data-testid="state">{JSON.stringify(state)}</span>
    </div>
  );
}

const freshState = () => ({ email, createdAt: minutesAgo(1) });
const expiredState = () => ({ email, createdAt: minutesAgo(6) });

function renderPage(state: unknown = freshState()) {
  const store = configureStore({ reducer: { auth: authReducer } });

  render(
    <Provider store={store}>
      <MemoryRouter
        initialEntries={[{ pathname: "/auth/forgot-password/otp", state }]}
        useTransitions={false}
      >
        <Routes>
          <Route
            path="/auth/forgot-password/otp"
            element={<VerifyForgotOtpPage />}
          />
          <Route
            path="/auth/forgot-password"
            element={<Destination label="Forgot password page" />}
          />
          <Route
            path="/auth/reset-password"
            element={<Destination label="Reset password page" />}
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

const otpInput = () => screen.getByLabelText("One-time passcode");
const submitButton = () => screen.getByRole("button", { name: "Verify OTP" });
const resendButton = () => screen.getByRole("button", { name: "Resend Otp" });

const fillAndSubmit = (otp = "123456") => {
  fireEvent.change(otpInput(), { target: { value: otp } });
  fireEvent.click(submitButton());
};

describe("VerifyForgotOtpPage", () => {
  beforeEach(() => {
    forgotPassword.mockReset();
    forgotPasswordOtpVerify.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  describe("rendering", () => {
    it("renders the form and names the email the code was sent to", () => {
      renderPage();

      expect(
        screen.getByRole("heading", { name: "Enter Verification otp" }),
      ).toBeInTheDocument();
      expect(screen.getByText(email)).toBeInTheDocument();
      expect(otpInput()).toBeEnabled();
      expect(submitButton()).toBeEnabled();
    });

    it("goes back to forgot password when the email is missing", () => {
      renderPage(null);

      expect(screen.getByText("Forgot password page")).toBeInTheDocument();
    });

    it("links back to sign in", () => {
      renderPage();

      fireEvent.click(screen.getByRole("link", { name: "Back to sign in" }));

      expect(screen.getByTestId("url")).toHaveTextContent(/^\/auth\/login$/);
    });

    it("keeps the return path in the sign-in link", () => {
      renderPage({ ...freshState(), redirectTo: "/orders" });

      fireEvent.click(screen.getByRole("link", { name: "Back to sign in" }));

      expect(screen.getByTestId("url")).toHaveTextContent(
        "/auth/login?redirect_uri=%2Forders",
      );
    });
  });

  describe("code lifetime", () => {
    it("shows the countdown while the code is valid", () => {
      renderPage();

      expect(
        screen.getByText(/OTP will expire in 0[34]:\d{2}/),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Resend Otp" }),
      ).not.toBeInTheDocument();
    });

    it("offers a resend once the code has expired", () => {
      renderPage(expiredState());

      expect(resendButton()).toBeEnabled();
      expect(screen.queryByText(/OTP will expire in/)).not.toBeInTheDocument();
    });
  });

  describe("verifying", () => {
    it("verifies the code and opens the reset page with the token", async () => {
      forgotPasswordOtpVerify.mockResolvedValue(verifyResponse);
      renderPage();

      fillAndSubmit();

      expect(
        await screen.findByText("Reset password page"),
      ).toBeInTheDocument();
      expect(forgotPasswordOtpVerify).toHaveBeenCalledWith({
        email,
        otp: "123456",
      });
      expect(JSON.parse(screen.getByTestId("state").textContent!)).toEqual({
        email,
        resetToken: "tok",
      });
      expect(toast.success).toHaveBeenCalledWith("Verified");
      expect(toast.error).not.toHaveBeenCalled();
    });

    it("hands the return path on to the reset page", async () => {
      forgotPasswordOtpVerify.mockResolvedValue(verifyResponse);
      renderPage({ ...freshState(), redirectTo: "/orders" });

      fillAndSubmit();

      await screen.findByText("Reset password page");
      expect(JSON.parse(screen.getByTestId("state").textContent!)).toEqual({
        email,
        resetToken: "tok",
        redirectTo: "/orders",
      });
    });

    it("shows the error inline and as a toast when the code is rejected", async () => {
      forgotPasswordOtpVerify.mockRejectedValue(new Error("network down"));
      renderPage();

      fillAndSubmit();

      expect(
        await screen.findByText("Failed to verify forgot password otp"),
      ).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to verify forgot password otp",
      );
      expect(toast.success).not.toHaveBeenCalled();
      expect(
        screen.getByRole("heading", { name: "Enter Verification otp" }),
      ).toBeInTheDocument();
      expect(submitButton()).toBeEnabled();
    });

    it("disables the form and shows progress while verifying", async () => {
      let resolveRequest: (value: unknown) => void = () => {};
      forgotPasswordOtpVerify.mockReturnValue(
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
      );
      renderPage();

      fillAndSubmit();

      const busyButton = await screen.findByRole("button", {
        name: /Verifying/,
      });
      expect(busyButton).toBeDisabled();
      expect(otpInput()).toBeDisabled();

      resolveRequest(verifyResponse);
      expect(
        await screen.findByText("Reset password page"),
      ).toBeInTheDocument();
    });
  });

  describe("resending", () => {
    it("requests a new code and restarts the countdown", async () => {
      forgotPassword.mockResolvedValue(resendResponse());
      renderPage(expiredState());

      fireEvent.click(resendButton());

      expect(await screen.findByText(/OTP will expire in/)).toBeInTheDocument();
      expect(forgotPassword).toHaveBeenCalledWith({ email });
      expect(toast.success).toHaveBeenCalledWith("OTP sent");
      expect(
        screen.queryByRole("button", { name: "Resend Otp" }),
      ).not.toBeInTheDocument();
    });

    it("shows progress and locks the form while sending", async () => {
      let resolveRequest: (value: unknown) => void = () => {};
      forgotPassword.mockReturnValue(
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
      );
      renderPage(expiredState());

      fireEvent.click(resendButton());

      const busyButton = await screen.findByRole("button", {
        name: /Sending/,
      });
      expect(busyButton).toBeDisabled();
      expect(otpInput()).toBeDisabled();
      expect(submitButton()).toBeDisabled();

      resolveRequest(resendResponse());
      expect(await screen.findByText(/OTP will expire in/)).toBeInTheDocument();
      expect(otpInput()).toBeEnabled();
    });

    it("shows the error and keeps the resend option when the request fails", async () => {
      forgotPassword.mockRejectedValue(new Error("network down"));
      renderPage(expiredState());

      fireEvent.click(resendButton());

      expect(
        await screen.findByText("Failed to send forgot password email"),
      ).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to send forgot password email",
      );
      expect(resendButton()).toBeEnabled();
    });
  });
});
