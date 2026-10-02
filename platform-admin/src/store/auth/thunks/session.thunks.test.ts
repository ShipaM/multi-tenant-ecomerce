import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchLogin,
  fetchLogout,
  fetchMe,
  verify2FaLoginOtp,
} from "./session.thunks";
import {
  apiFailure,
  itBehavesLikeSimpleThunk,
  makeStore,
} from "./thunk-test-utils";

const api = vi.hoisted(() => ({
  login: vi.fn(),
  me: vi.fn(),
  logout: vi.fn(),
  verify2FaLoginOtp: vi.fn(),
}));

const storage = vi.hoisted(() => ({
  getAccessToken: vi.fn(() => null),
  getRefreshToken: vi.fn(() => null),
  setTokens: vi.fn(),
  setUserType: vi.fn(),
  clearStorage: vi.fn(),
}));

vi.mock("@/api/auth", () => ({ authApi: api }));
vi.mock("@/lib/storage", () => ({ storage }));

const complete = {
  accessToken: "access",
  refreshToken: "refresh",
  userType: "PLATFORM_ADMIN",
};
const twoFactor = {
  twoFactorRequired: true,
  twoFactorToken: "2fa-token",
  message: "2FA required",
};
const credentials = { email: "jane@example.com", password: "secret" };

beforeEach(() => {
  vi.resetAllMocks();
});

// fetchLogin and verify2FaLoginOtp resolve a login response the same way.
describe.each([
  {
    name: "fetchLogin",
    api: api.login,
    run: (store: ReturnType<typeof makeStore>) =>
      store.dispatch(fetchLogin(credentials)),
    loadingFlag: "isLoginLoading",
  },
  {
    name: "verify2FaLoginOtp",
    api: api.verify2FaLoginOtp,
    run: (store: ReturnType<typeof makeStore>) =>
      store.dispatch(
        verify2FaLoginOtp({ twoFactorToken: "t", otp: "123456" } as never),
      ),
    loadingFlag: "isVerify2FaLoginOtpLoading",
  },
] as const)("$name", ({ api: apiMethod, run, loadingFlag }) => {
  it("persists tokens and user type for a complete login", async () => {
    apiMethod.mockResolvedValue(complete);
    const store = makeStore();

    const action = await run(store);

    expect(action.type.endsWith("/fulfilled")).toBe(true);
    expect(storage.setTokens).toHaveBeenCalledWith("access", "refresh");
    expect(storage.setUserType).toHaveBeenCalledWith("PLATFORM_ADMIN");
    expect(store.getState().auth).toMatchObject({
      accessToken: "access",
      refreshToken: "refresh",
      twoFactorRequired: false,
      [loadingFlag]: false,
    });
  });

  it("keeps the 2FA token and stores no session when 2FA is required", async () => {
    apiMethod.mockResolvedValue(twoFactor);
    const store = makeStore();

    const action = await run(store);

    expect(action.type.endsWith("/fulfilled")).toBe(true);
    expect(storage.setTokens).not.toHaveBeenCalled();
    expect(store.getState().auth).toMatchObject({
      accessToken: null,
      twoFactorRequired: true,
      twoFactorToken: "2fa-token",
    });
  });

  it("rejects an incomplete response", async () => {
    apiMethod.mockResolvedValue({ accessToken: "only-access" });
    const store = makeStore();

    const action = await run(store);

    expect(action.type.endsWith("/rejected")).toBe(true);
    expect(action.payload).toBe("Could not Sign in: incomplete response");
    expect(storage.setTokens).not.toHaveBeenCalled();
    expect(store.getState().auth.error).toBe(
      "Could not Sign in: incomplete response",
    );
  });

  it("rejects with the server message, clears storage and the session", async () => {
    apiMethod.mockRejectedValue(apiFailure("Invalid credentials", 401));
    const store = makeStore();

    const action = await run(store);

    expect(action.payload).toBe("Invalid credentials");
    expect(storage.clearStorage).toHaveBeenCalled();
    expect(store.getState().auth).toMatchObject({
      error: "Invalid credentials",
      accessToken: null,
      refreshToken: null,
      [loadingFlag]: false,
    });
  });

  it("rejects with the fallback message for a non-api error", async () => {
    apiMethod.mockRejectedValue(new Error("network down"));

    const action = await run(makeStore());

    expect(action.payload).toBe("Could not Sign in");
  });
});

describe("fetchLogin", () => {
  it("sends the credentials to the api", async () => {
    api.login.mockResolvedValue(complete);

    await makeStore().dispatch(fetchLogin(credentials));

    expect(api.login).toHaveBeenCalledWith(credentials);
  });

  it("sets the loading flag while the request is in flight", async () => {
    api.login.mockResolvedValue(complete);
    const store = makeStore();

    const pending = store.dispatch(fetchLogin(credentials));

    expect(store.getState().auth.isLoginLoading).toBe(true);
    await pending;
  });
});

describe("fetchMe", () => {
  const user = {
    id: "u1",
    email: "jane@example.com",
    fullName: "Jane Doe",
    userType: "PLATFORM_ADMIN",
    phone: "555-0100",
    status: "ACTIVE",
  };

  it("stores the user with an avatar name", async () => {
    api.me.mockResolvedValue(user);
    const store = makeStore();

    const action = await store.dispatch(fetchMe());

    expect(action.type.endsWith("/fulfilled")).toBe(true);
    expect(store.getState().auth.user).toMatchObject({
      email: "jane@example.com",
      avatarName: "JD",
    });
    expect(store.getState().auth.isMeLoading).toBe(false);
  });

  it("flags a 401 as unauthorized, clears storage and drops the tokens", async () => {
    api.me.mockRejectedValue(apiFailure("Unauthorized", 401));
    const store = makeStore({ accessToken: "stale", refreshToken: "stale" });

    const action = await store.dispatch(fetchMe());

    expect(action.payload).toEqual({
      message: "Unauthorized",
      unauthorized: true,
    });
    expect(storage.clearStorage).toHaveBeenCalled();
    expect(store.getState().auth).toMatchObject({
      user: null,
      accessToken: null,
      refreshToken: null,
      error: "Unauthorized",
    });
  });

  it("keeps the session on a non-401 failure", async () => {
    api.me.mockRejectedValue(apiFailure("Server exploded", 500));
    const store = makeStore({ accessToken: "access", refreshToken: "refresh" });

    const action = await store.dispatch(fetchMe());

    expect(action.payload).toEqual({
      message: "Server exploded",
      unauthorized: false,
    });
    expect(storage.clearStorage).not.toHaveBeenCalled();
    expect(store.getState().auth).toMatchObject({
      user: null,
      accessToken: "access",
      refreshToken: "refresh",
      error: "Server exploded",
    });
  });

  it("falls back to a default message for a non-api error", async () => {
    api.me.mockRejectedValue(new Error("network down"));

    const action = await makeStore().dispatch(fetchMe());

    expect(action.payload).toEqual({
      message: "Could not load the current user",
      unauthorized: false,
    });
  });
});

describe("fetchLogout", () => {
  itBehavesLikeSimpleThunk({
    api: api.logout,
    run: (store) => store.dispatch(fetchLogout()),
    expectedArgs: [],
    data: { success: true },
    fallback: "Could not Sign out",
  });

  it("clears the session and storage on success", async () => {
    api.logout.mockResolvedValue({ success: true });
    const store = makeStore();

    await store.dispatch(fetchLogout());

    expect(storage.clearStorage).toHaveBeenCalled();
    expect(store.getState().auth).toMatchObject({
      user: null,
      accessToken: null,
      refreshToken: null,
      error: null,
      isLogoutLoading: false,
    });
  });

  it("still clears the session locally when the api call fails", async () => {
    api.logout.mockRejectedValue(apiFailure("Server says no"));
    const store = makeStore();

    await store.dispatch(fetchLogout());

    expect(storage.clearStorage).toHaveBeenCalled();
    expect(store.getState().auth).toMatchObject({
      user: null,
      accessToken: null,
      error: "Server says no",
      isLogoutLoading: false,
    });
  });
});
