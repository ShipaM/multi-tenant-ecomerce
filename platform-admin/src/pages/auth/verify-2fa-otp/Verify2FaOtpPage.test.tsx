import { fireEvent, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import authReducer from "@/store/auth/authSlice";
import Verify2FaOtpPage from "./Verify2FaOtpPage";

const verify2FaLoginOtp = vi.hoisted(() => vi.fn());

vi.mock("@/api/auth", () => ({ authApi: { verify2FaLoginOtp } }));

const email = "jane@example.com";
const completeResponse = {
  accessToken: "access",
  refreshToken: "refresh",
  userType: "PLATFORM_ADMIN",
};

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

function renderPage(state: unknown = { email, twoFactorToken: "2fa-tok" }) {
  const store = configureStore({ reducer: { auth: authReducer } });

  render(
    <Provider store={store}>
      <MemoryRouter
        initialEntries={[{ pathname: "/auth/2fa", state }]}
        useTransitions={false}
      >
        <Routes>
          <Route path="/auth/2fa" element={<Verify2FaOtpPage />} />
          <Route
            path="/auth/login"
            element={<Destination label="Login page" />}
          />
          <Route
            path="/dashboard"
            element={<Destination label="Dashboard page" />}
          />
          <Route path="/orders" element={<Destination label="Orders page" />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

const otpInput = () => screen.getByLabelText("One-time passcode");
const submitButton = () =>
  screen.getByRole("button", { name: "Verify 2FA OTP" });

const fillAndSubmit = (otp = "123456") => {
  fireEvent.change(otpInput(), { target: { value: otp } });
  fireEvent.click(submitButton());
};

describe("Verify2FaOtpPage", () => {
  beforeEach(() => {
    verify2FaLoginOtp.mockReset();
  });

  describe("rendering", () => {
    it("renders the form and names the email the code was sent to", () => {
      renderPage();

      expect(
        screen.getByRole("heading", { name: "Enter 2FA otp" }),
      ).toBeInTheDocument();
      expect(screen.getByText(email)).toBeInTheDocument();
      expect(otpInput()).toBeEnabled();
      expect(submitButton()).toBeEnabled();
    });

    it("uses a generic hint when the email is unknown", () => {
      renderPage({ twoFactorToken: "2fa-tok" });

      expect(
        screen.getByText("We sent a 6 digit otp to your email address."),
      ).toBeInTheDocument();
    });

    it("goes back to login when the 2FA token is missing", () => {
      renderPage(null);

      expect(screen.getByText("Login page")).toBeInTheDocument();
    });

    it("links back to sign in", () => {
      renderPage();

      fireEvent.click(screen.getByRole("link", { name: "Back to sign in" }));

      expect(screen.getByTestId("url")).toHaveTextContent(/^\/auth\/login$/);
    });

    it("keeps the return path in the sign-in link", () => {
      renderPage({ email, twoFactorToken: "2fa-tok", redirectTo: "/orders" });

      fireEvent.click(screen.getByRole("link", { name: "Back to sign in" }));

      expect(screen.getByTestId("url")).toHaveTextContent(
        "/auth/login?redirect_uri=%2Forders",
      );
    });
  });

  describe("verifying", () => {
    it("sends the token and code, then opens the dashboard by default", async () => {
      verify2FaLoginOtp.mockResolvedValue(completeResponse);
      renderPage();

      fillAndSubmit();

      expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
      expect(verify2FaLoginOtp).toHaveBeenCalledWith({
        twoFactorToken: "2fa-tok",
        otp: "123456",
      });
    });

    it("returns to the page the user came from", async () => {
      verify2FaLoginOtp.mockResolvedValue(completeResponse);
      renderPage({ email, twoFactorToken: "2fa-tok", redirectTo: "/orders" });

      fillAndSubmit();

      expect(await screen.findByText("Orders page")).toBeInTheDocument();
    });

    it("ignores an unsafe return path", async () => {
      verify2FaLoginOtp.mockResolvedValue(completeResponse);
      renderPage({
        email,
        twoFactorToken: "2fa-tok",
        redirectTo: "//evil.example.com",
      });

      fillAndSubmit();

      expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
    });

    it("shows the error and stays on the page when the code is rejected", async () => {
      verify2FaLoginOtp.mockRejectedValue(new Error("network down"));
      renderPage();

      fillAndSubmit();

      expect(await screen.findByText("Could not Sign in")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Enter 2FA otp" }),
      ).toBeInTheDocument();
      expect(submitButton()).toBeEnabled();
    });

    it("disables the form and shows progress while verifying", async () => {
      let resolveRequest: (value: unknown) => void = () => {};
      verify2FaLoginOtp.mockReturnValue(
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

      resolveRequest(completeResponse);
      expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
    });
  });
});
