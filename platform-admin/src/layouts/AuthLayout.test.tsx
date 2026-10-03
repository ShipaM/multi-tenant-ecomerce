import { act, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";

import authReducer from "@/store/auth/authSlice";
import { expectNoA11yViolations } from "@/test/axe";
import AuthLayout from "./AuthLayout";

vi.mock("@/assets/platform-logo.png", () => ({ default: "logo.png" }));

function renderLayout() {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: undefined,
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/auth/login"]} useTransitions={false}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route
              path="/auth/login"
              element={<Link to="/auth/forgot-password">Forgot</Link>}
            />
            <Route path="/auth/forgot-password" element={<h1>Forgot</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe("AuthLayout accessibility", () => {
  it("renders the page inside a main landmark", async () => {
    renderLayout();

    expect(await screen.findByRole("main")).toBeInTheDocument();
  });

  it("treats the decorative logo as presentational", async () => {
    const { container } = renderLayout();
    await screen.findByRole("main");

    const logo = container.querySelector("img");
    expect(logo).toHaveAttribute("alt", "");
  });

  it("moves focus to the main landmark after navigating to another auth page", async () => {
    renderLayout();
    const link = await screen.findByRole("link", { name: "Forgot" });

    await act(async () => link.click());

    expect(await screen.findByRole("main")).toHaveFocus();
  });

  it("has no axe violations", async () => {
    const { container } = renderLayout();
    await screen.findByRole("main");

    await expectNoA11yViolations(container);
  });
});
