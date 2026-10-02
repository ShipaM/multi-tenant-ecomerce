import { fireEvent, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import authReducer from "@/store/auth/authSlice";
import ForgotPasswordPage from "./ForgotPasswordPage";

const forgotPassword = vi.hoisted(() => vi.fn());

vi.mock("@/api/auth", () => ({ authApi: { forgotPassword } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const createdAt = "2026-10-02T10:00:00.000Z";
const successResponse = {
  success: true,
  message: "OTP sent",
  data: { createdAt },
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

function renderPage() {
  const store = configureStore({ reducer: { auth: authReducer } });

  render(
    <Provider store={store}>
      <MemoryRouter
        initialEntries={["/auth/forgot-password"]}
        useTransitions={false}
      >
        <Routes>
          <Route
            path="/auth/forgot-password"
            element={<ForgotPasswordPage />}
          />
          <Route
            path="/auth/forgot-password/otp"
            element={<Destination label="OTP page" />}
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

const emailInput = () => screen.getByPlaceholderText("you@platform.com");
const submitButton = () => screen.getByRole("button", { name: "Send OTP" });

const fillAndSubmit = (email = "jane@example.com") => {
  fireEvent.change(emailInput(), { target: { value: email } });
  fireEvent.click(submitButton());
};

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    forgotPassword.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("renders the form", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Forgot Password" }),
    ).toBeInTheDocument();
    expect(emailInput()).toHaveAttribute("type", "email");
    expect(submitButton()).toBeEnabled();
  });

  it("goes back to the sign-in page", () => {
    renderPage();

    fireEvent.click(screen.getByRole("link", { name: "Back to sign in" }));

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  describe("validation", () => {
    it("requires an email and does not call the api", () => {
      renderPage();

      fireEvent.click(submitButton());

      expect(screen.getByText("Email is required")).toBeInTheDocument();
      expect(emailInput()).toHaveAttribute("aria-invalid", "true");
      expect(forgotPassword).not.toHaveBeenCalled();
    });

    it("rejects a malformed email", () => {
      renderPage();

      fillAndSubmit("not-an-email");

      expect(
        screen.getByText("Enter a valid email address"),
      ).toBeInTheDocument();
      expect(forgotPassword).not.toHaveBeenCalled();
    });

    it("clears the error as soon as the field is edited", () => {
      renderPage();
      fireEvent.click(submitButton());

      fireEvent.change(emailInput(), { target: { value: "j" } });

      expect(screen.queryByText("Email is required")).not.toBeInTheDocument();
      expect(emailInput()).toHaveAttribute("aria-invalid", "false");
    });
  });

  it("requests the code, shows a success toast and opens the OTP page", async () => {
    forgotPassword.mockResolvedValue(successResponse);
    renderPage();

    fillAndSubmit();

    expect(await screen.findByText("OTP page")).toBeInTheDocument();
    expect(forgotPassword).toHaveBeenCalledWith({ email: "jane@example.com" });
    expect(JSON.parse(screen.getByTestId("state").textContent!)).toEqual({
      email: "jane@example.com",
      createdAt,
    });
    expect(toast.success).toHaveBeenCalledWith("OTP sent");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows the error inline and as a toast when the request fails", async () => {
    forgotPassword.mockRejectedValue(new Error("network down"));
    renderPage();

    fillAndSubmit();

    expect(
      await screen.findByText("Failed to send forgot password email"),
    ).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(
      "Failed to send forgot password email",
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Forgot Password" }),
    ).toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
  });

  it("disables the form and shows progress while sending", async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    forgotPassword.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    renderPage();

    fillAndSubmit();

    const busyButton = await screen.findByRole("button", {
      name: /Sending otp/,
    });
    expect(busyButton).toBeDisabled();
    expect(emailInput()).toBeDisabled();

    resolveRequest(successResponse);
    expect(await screen.findByText("OTP page")).toBeInTheDocument();
  });
});
