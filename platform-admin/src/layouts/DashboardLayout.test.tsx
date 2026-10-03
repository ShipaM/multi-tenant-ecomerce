import { fireEvent, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import authReducer from "@/store/auth/authSlice";
import { expectNoA11yViolations } from "@/test/axe";
import type { User } from "@/types";
import DashboardLayout from "./DashboardLayout";

vi.mock("@/api/auth", () => ({ authApi: { me: vi.fn(), logout: vi.fn() } }));

const user: User = {
  id: "u1",
  email: "jane@example.com",
  fullName: "Jane Doe",
  userType: "PLATFORM_ADMIN",
  phone: "555-0100",
  status: "ACTIVE",
  createdAt: new Date(),
  updatedAt: new Date(),
  avatarName: "JD",
};

function renderLayout() {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { ...authReducer(undefined, { type: "@@INIT" }), user },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/dashboard"]} useTransitions={false}>
        <Routes>
          <Route path="dashboard" element={<DashboardLayout />}>
            <Route index element={<div>Dashboard content</div>} />
            <Route path="my-account" element={<div>Account page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe("DashboardLayout", () => {
  beforeEach(() => {
    // jsdom does not implement matchMedia; the sidebar provider needs it.
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it("renders the routed page inside the layout", async () => {
    renderLayout();

    expect(await screen.findByText("Dashboard content")).toBeInTheDocument();
  });

  it("offers a labelled search field", async () => {
    renderLayout();
    await screen.findByText("Dashboard content");

    expect(screen.getByRole("textbox", { name: "Search" })).toBeInTheDocument();
  });

  it("shows the sidebar and a toggle for it", async () => {
    renderLayout();
    await screen.findByText("Dashboard content");

    expect(
      screen.getByRole("button", { name: /toggle sidebar/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });

  it("opens the account menu with a link to the account page", async () => {
    renderLayout();
    await screen.findByText("Dashboard content");

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    fireEvent.click(await screen.findByRole("link", { name: "My Account" }));

    expect(await screen.findByText("Account page")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = renderLayout();
    await screen.findByText("Dashboard content");

    await expectNoA11yViolations(container);
  });
});
