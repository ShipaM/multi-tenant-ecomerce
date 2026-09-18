import { fireEvent, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "./ui/sidebar";
import authReducer from "@/store/auth/authSlice";
import type { AuthState } from "@/store/auth/auth.types";
import type { User } from "@/types";

const logout = vi.fn();

vi.mock("@/api/auth", () => ({
  authApi: {
    me: vi.fn(),
    logout: (...args: unknown[]) => logout(...args),
  },
}));

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

function renderSidebar(preloadedAuth: Partial<AuthState>, path = "/dashboard") {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { ...authReducer(undefined, { type: "@@INIT" }), ...preloadedAuth },
    },
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]} useTransitions={false}>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>
    </Provider>,
  );

  return store;
}

describe("AppSidebar", () => {
  beforeEach(() => {
    logout.mockReset().mockResolvedValue({ success: true });

    // jsdom does not implement matchMedia; the shadcn SidebarProvider needs
    // it to decide whether it's on a mobile viewport.
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: "",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as typeof window.matchMedia;
  });

  it("renders every nav item with a link to its section", () => {
    renderSidebar({ user });

    expect(
      screen.getByRole("link", { name: /dashboard/i }),
    ).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /sellers/i })).toHaveAttribute(
      "href",
      "/dashboard/sellers",
    );
    expect(
      screen.getByRole("link", { name: /users & permissions/i }),
    ).toHaveAttribute("href", "/dashboard/users-permissions");
  });

  it("marks only the link matching the current route as the current page", () => {
    renderSidebar({ user }, "/dashboard/sellers");

    expect(screen.getByRole("link", { name: /sellers/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Dashboard" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("shows the signed-in user's name and email", () => {
    renderSidebar({ user });

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("signs the user out when the logout button is clicked", () => {
    renderSidebar({ user });

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("disables the logout button while signing out", () => {
    renderSidebar({ user, isLogoutLoading: true });

    expect(screen.getByRole("button", { name: "Log out" })).toBeDisabled();
  });
});
