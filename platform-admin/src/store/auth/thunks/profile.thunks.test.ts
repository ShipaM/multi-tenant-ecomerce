import { beforeEach, describe, expect, it, vi } from "vitest";

import { changePassword, updateUser } from "./profile.thunks";
import { itBehavesLikeSimpleThunk, makeStore } from "./thunk-test-utils";

const api = vi.hoisted(() => ({
  updateUser: vi.fn(),
  changePassword: vi.fn(),
}));

vi.mock("@/api/auth", () => ({ authApi: api }));

const user = {
  id: "u1",
  email: "jane@example.com",
  fullName: "Jane Doe",
  userType: "PLATFORM_ADMIN",
  phone: "555-0100",
  status: "ACTIVE",
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("updateUser", () => {
  const payload = {
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "555-0100",
  };

  itBehavesLikeSimpleThunk({
    api: api.updateUser,
    run: (store) => store.dispatch(updateUser(payload)),
    expectedArgs: [payload],
    data: { message: "ok", user },
    fallback: "Failed to update the current user",
  });

  it("stores the updated user with an avatar name and clears the loading flag", async () => {
    api.updateUser.mockResolvedValue({ message: "ok", user });
    const store = makeStore();

    const pending = store.dispatch(updateUser(payload));
    expect(store.getState().auth.isUpdateUserLoading).toBe(true);
    await pending;

    expect(store.getState().auth.isUpdateUserLoading).toBe(false);
    expect(store.getState().auth.user).toMatchObject({
      email: "jane@example.com",
      avatarName: "JD",
    });
  });

  it("clears the loading flag when the update fails", async () => {
    api.updateUser.mockRejectedValue(new Error("boom"));
    const store = makeStore();

    await store.dispatch(updateUser(payload));

    expect(store.getState().auth.isUpdateUserLoading).toBe(false);
    expect(store.getState().auth.user).toBeNull();
  });
});

describe("changePassword", () => {
  const payload = { currentPassword: "old", newPassword: "new" };

  itBehavesLikeSimpleThunk({
    api: api.changePassword,
    run: (store) => store.dispatch(changePassword(payload as never)),
    expectedArgs: [payload],
    data: { message: "ok", user },
    fallback: "Failed to update the current user",
  });

  it("toggles the loading flag around the request", async () => {
    api.changePassword.mockResolvedValue({ message: "ok", user });
    const store = makeStore();

    const pending = store.dispatch(changePassword(payload as never));
    expect(store.getState().auth.isChangePasswordLoading).toBe(true);
    await pending;

    expect(store.getState().auth.isChangePasswordLoading).toBe(false);
    expect(store.getState().auth.user?.avatarName).toBe("JD");
  });
});
