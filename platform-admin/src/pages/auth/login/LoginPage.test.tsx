import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import authReducer from "@/store/auth/authSlice";
import LoginPage from "./LoginPage";

const login = vi.hoisted(() => vi.fn());

vi.mock("@/api/auth", () => ({ authApi: { login } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const completeResponse = {
  accessToken: "access",
  refreshToken: "refresh",
  userType: "PLATFORM_ADMIN",
};

function Destination({ label }: { label: string }) {
  const { state } = useLocation();
  return (
    <div>
      {label}
      <span data-testid="state">{JSON.stringify(state)}</span>
    </div>
  );
}

function renderLogin(url = "/auth/login") {
  const store = configureStore({ reducer: { auth: authReducer } });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[url]} useTransitions={false}>
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route
            path="/auth/forgot-password"
            element={<Destination label="Forgot password page" />}
          />
          <Route path="/auth/2fa" element={<Destination label="2FA page" />} />
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

const emailInput = () => screen.getByPlaceholderText("you@platform.com");
const passwordInput = () => screen.getByPlaceholderText("••••••••");
const submitButton = () => screen.getByRole("button", { name: "Sign in" });

const fillAndSubmit = (email = "jane@example.com", password = "secret") => {
  fireEvent.change(emailInput(), { target: { value: email } });
  fireEvent.change(passwordInput(), { target: { value: password } });
  fireEvent.click(submitButton());
};

describe("LoginPage", () => {
  beforeEach(() => {
    login.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("renders the sign-in form", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", { name: "Sign In" }),
    ).toBeInTheDocument();
    expect(emailInput()).toHaveAttribute("type", "email");
    expect(passwordInput()).toHaveAttribute("type", "password");
    expect(submitButton()).toBeEnabled();
    expect(
      screen.getByRole("link", { name: "Forgot Password?" }),
    ).toHaveAttribute("href", "/auth/forgot-password");
  });

  it("links to the forgot-password page", () => {
    renderLogin();

    fireEvent.click(screen.getByRole("link", { name: "Forgot Password?" }));

    expect(screen.getByText("Forgot password page")).toBeInTheDocument();
  });

  describe("validation", () => {
    it("shows an error for each empty field and does not call the api", () => {
      renderLogin();

      fireEvent.click(submitButton());

      expect(screen.getByText("Email is required")).toBeInTheDocument();
      expect(screen.getByText("Password is required")).toBeInTheDocument();
      expect(emailInput()).toHaveAttribute("aria-invalid", "true");
      expect(passwordInput()).toHaveAttribute("aria-invalid", "true");
      expect(login).not.toHaveBeenCalled();
    });

    it("rejects a malformed email", () => {
      renderLogin();

      fillAndSubmit("not-an-email", "secret");

      expect(
        screen.getByText("Enter a valid email address"),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Password is required"),
      ).not.toBeInTheDocument();
      expect(login).not.toHaveBeenCalled();
    });

    it("clears a field's error as soon as the field is edited", () => {
      renderLogin();
      fireEvent.click(submitButton());

      fireEvent.change(emailInput(), { target: { value: "j" } });

      expect(screen.queryByText("Email is required")).not.toBeInTheDocument();
      expect(emailInput()).toHaveAttribute("aria-invalid", "false");
      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });
  });

  describe("successful login", () => {
    it("sends the credentials, shows a success toast and opens the dashboard", async () => {
      login.mockResolvedValue(completeResponse);
      renderLogin();

      fillAndSubmit();

      expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
      expect(login).toHaveBeenCalledWith({
        email: "jane@example.com",
        password: "secret",
      });
      expect(toast.success).toHaveBeenCalledWith("Signed in successfully");
      expect(toast.error).not.toHaveBeenCalled();
    });

    it("returns to the page given in redirect_uri", async () => {
      login.mockResolvedValue(completeResponse);
      renderLogin("/auth/login?redirect_uri=/orders");

      fillAndSubmit();

      expect(await screen.findByText("Orders page")).toBeInTheDocument();
    });

    it("ignores an unsafe redirect_uri", async () => {
      login.mockResolvedValue(completeResponse);
      renderLogin(
        `/auth/login?redirect_uri=${encodeURIComponent("//evil.com")}`,
      );

      fillAndSubmit();

      expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
    });
  });

  it("moves to the 2FA page with the token, email and redirect target", async () => {
    login.mockResolvedValue({
      twoFactorRequired: true,
      twoFactorToken: "2fa-token",
      message: "2FA required",
    });
    renderLogin("/auth/login?redirect_uri=/orders");

    fillAndSubmit();

    expect(await screen.findByText("2FA page")).toBeInTheDocument();
    expect(JSON.parse(screen.getByTestId("state").textContent!)).toEqual({
      twoFactorToken: "2fa-token",
      email: "jane@example.com",
      redirectTo: "/orders",
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("shows the error inline and as a toast when login fails, staying on the page", async () => {
    login.mockRejectedValue(new Error("network down"));
    renderLogin();

    fillAndSubmit();

    expect(await screen.findByText("Could not Sign in")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Could not Sign in");
    expect(toast.success).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Sign In" }),
    ).toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
  });

  it("disables the form and shows progress while signing in", async () => {
    let resolveLogin: (value: unknown) => void = () => {};
    login.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      }),
    );
    renderLogin();

    fillAndSubmit();

    const busyButton = await screen.findByRole("button", {
      name: /Signing in\.\.\./,
    });
    expect(busyButton).toBeDisabled();
    expect(emailInput()).toBeDisabled();
    expect(passwordInput()).toBeDisabled();

    resolveLogin(completeResponse);
    await waitFor(() =>
      expect(screen.getByText("Dashboard page")).toBeInTheDocument(),
    );
  });
});
