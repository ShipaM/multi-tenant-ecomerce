import { render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "./ProtectedRoute";
import authReducer from "@/store/auth/authSlice";
import type { AuthState } from "@/store/auth/auth.types";
import type { User } from "@/types";

const me = vi.fn();
const logout = vi.fn();

vi.mock("@/api/auth", () => ({
  authApi: {
    me: (...args: unknown[]) => me(...args),
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
};

function LoginPageStub() {
  const location = useLocation();
  return <div>Sign in page: {location.search}</div>;
}

function renderProtected(preloadedAuth: Partial<AuthState>, path = "/dashboard") {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { ...authReducer(undefined, { type: "@@INIT" }), ...preloadedAuth },
    },
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]} useTransitions={false}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Protected content</div>} />
          </Route>
          <Route path="/auth/login" element={<LoginPageStub />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

  return store;
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    me.mockReset().mockResolvedValue(user);
    logout.mockReset();
  });

  it("redirects to the login page, preserving the originally requested path, when signed out", async () => {
    renderProtected({ accessToken: null, user: null }, "/dashboard?tab=orders");

    const expectedRedirect = encodeURIComponent("/dashboard?tab=orders");
    expect(
      await screen.findByText(`Sign in page: ?redirect_uri=${expectedRedirect}`),
    ).toBeInTheDocument();
  });

  it("shows a loading state and fetches the current user while a token is present but the user hasn't loaded yet", () => {
    renderProtected({ accessToken: "token", user: null });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(me).toHaveBeenCalledTimes(1);
  });

  it("renders the protected content once signed in", async () => {
    renderProtected({ accessToken: "token", user });

    // Mounting re-validates the session via fetchMe() even when a user is
    // already preloaded, so the content only appears once that settles.
    expect(await screen.findByText("Protected content")).toBeInTheDocument();
    expect(screen.queryByText("Sign in page")).not.toBeInTheDocument();
  });
});
