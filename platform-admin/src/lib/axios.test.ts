import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LOCAL_STORAGE_KEYS } from "@/lib/storage";

const requested: string[] = [];

let respond: (config: InternalAxiosRequestConfig) => AxiosResponse;

// Installed on the shared defaults rather than on the instance, because the
// module under test builds its clients at import time.
axios.defaults.adapter = async (config) => {
  requested.push(config.url ?? "");

  return respond(config);
};

function ok(
  config: InternalAxiosRequestConfig,
  data: unknown = {},
): AxiosResponse {
  return { data, status: 200, statusText: "OK", headers: {}, config };
}

function unauthorized(config: InternalAxiosRequestConfig): never {
  throw new AxiosError("Unauthorized", "401", config, null, {
    data: {},
    status: 401,
    statusText: "Unauthorized",
    headers: {},
    config,
  });
}

// The runtime hands jsdom a partial localStorage, so the test brings its own.
function installStorage() {
  const entries = new Map<string, string>();

  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
      removeItem: (key: string) => entries.delete(key),
      clear: () => entries.clear(),
    },
    writable: true,
    configurable: true,
  });
}

function refreshCallCount() {
  return requested.filter((url) => url === "/auth/refresh").length;
}

async function loadClient() {
  vi.resetModules();

  return (await import("@/lib/axios")).default;
}

describe("Axios client", () => {
  beforeEach(() => {
    requested.length = 0;
    installStorage();
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, "stale-access");
    localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, "first-refresh");

    Object.defineProperty(window, "location", {
      value: { href: "/dashboard" },
      writable: true,
      configurable: true,
    });
  });

  it("replays a 401 against the endpoint the API actually exposes", async () => {
    respond = (config) => {
      if (config.url === "/auth/refresh") {
        return ok(config, {
          accessToken: "fresh-access",
          refreshToken: "second-refresh",
        });
      }

      if (config.headers.Authorization === "Bearer fresh-access") {
        return ok(config, { id: "u1" });
      }

      unauthorized(config);
    };

    const client = await loadClient();
    const response = await client.get("/users/me");

    expect(requested).toEqual(["/users/me", "/auth/refresh", "/users/me"]);
    expect(response.data).toEqual({ id: "u1" });
    // The API rotates the refresh token, so the new one has to be kept too.
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN)).toBe(
      "second-refresh",
    );
  });

  it("exchanges the refresh token once for requests that fail together", async () => {
    respond = (config) => {
      if (config.url === "/auth/refresh") {
        return ok(config, {
          accessToken: "fresh-access",
          refreshToken: "second-refresh",
        });
      }

      if (config.headers.Authorization === "Bearer fresh-access") {
        return ok(config, { url: config.url });
      }

      unauthorized(config);
    };

    const client = await loadClient();
    const responses = await Promise.all([
      client.get("/a"),
      client.get("/b"),
      client.get("/c"),
    ]);

    expect(refreshCallCount()).toBe(1);
    expect(responses.map((response) => response.data)).toEqual([
      { url: "/a" },
      { url: "/b" },
      { url: "/c" },
    ]);
  });

  it("stops after one exchange when the refresh call is itself rejected", async () => {
    respond = (config) => unauthorized(config);

    const client = await loadClient();

    await expect(client.get("/users/me")).rejects.toBeInstanceOf(AxiosError);

    expect(refreshCallCount()).toBe(1);
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
    expect(window.location.href).toBe("/auth/login");
  });

  it("leaves an unauthenticated request alone", async () => {
    installStorage();
    respond = (config) => unauthorized(config);

    const client = await loadClient();

    await expect(
      client.post("/auth/login", { email: "a@b.com", password: "wrong" }),
    ).rejects.toBeInstanceOf(AxiosError);

    expect(requested).toEqual(["/auth/login"]);
    expect(window.location.href).toBe("/dashboard");
  });

  it("does not sign the user out when the replayed request fails on its own", async () => {
    respond = (config) => {
      if (config.url === "/auth/refresh") {
        return ok(config, {
          accessToken: "fresh-access",
          refreshToken: "second-refresh",
        });
      }

      if (config.headers.Authorization === "Bearer fresh-access") {
        throw new AxiosError("Boom", "500", config, null, {
          data: {},
          status: 500,
          statusText: "Internal Server Error",
          headers: {},
          config,
        });
      }

      unauthorized(config);
    };

    const client = await loadClient();

    await expect(client.get("/users/me")).rejects.toMatchObject({
      response: { status: 500 },
    });

    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN)).toBe(
      "fresh-access",
    );
    expect(window.location.href).toBe("/dashboard");
  });

  it("keeps a stale token out of the sign-in request", async () => {
    let sentAuthorization: unknown = "unset";

    respond = (config) => {
      sentAuthorization = config.headers.Authorization;
      unauthorized(config);
    };

    const client = await loadClient();

    await expect(
      client.post("/auth/login", { email: "a@b.com", password: "wrong" }),
    ).rejects.toBeInstanceOf(AxiosError);

    // A 401 here is about the credentials, not about an expired session, so the
    // leftover token must neither be sent nor trigger a refresh and a redirect.
    expect(sentAuthorization).toBeUndefined();
    expect(refreshCallCount()).toBe(0);
    expect(requested).toEqual(["/auth/login"]);
    expect(window.location.href).toBe("/dashboard");
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN)).toBe(
      "stale-access",
    );
  });
});
