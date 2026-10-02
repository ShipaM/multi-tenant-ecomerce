import { configureStore } from "@reduxjs/toolkit";
import { AxiosError, type AxiosResponse } from "axios";
import { expect, it, type Mock } from "vitest";

import authReducer from "@/store/auth/authSlice";
import type { AuthState } from "@/store/auth/auth.types";

export type TestStore = ReturnType<typeof makeStore>;

export const makeStore = (preloadedAuth: Partial<AuthState> = {}) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { ...authReducer(undefined, { type: "@@INIT" }), ...preloadedAuth },
    },
  });

// An error shaped like the one axios throws for a non-2xx API response.
export const apiFailure = (message: string | string[], status = 400) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    data: { message },
  } as AxiosResponse);

type SimpleThunkCase = {
  /** Mocked `authApi` method the thunk calls. */
  api: Mock;
  /** Dispatches the thunk under test. */
  run: (store: TestStore) => Promise<{ type: string; payload?: unknown }>;
  /** Arguments the thunk should pass to the api method. */
  expectedArgs: unknown[];
  /** Value the api resolves with; the thunk fulfills with the same value. */
  data: unknown;
  /** Message the thunk rejects with when the error carries none. */
  fallback: string;
};

/** The shared contract of the thunks that only forward a call to the api. */
export const itBehavesLikeSimpleThunk = ({
  api,
  run,
  expectedArgs,
  data,
  fallback,
}: SimpleThunkCase) => {
  it("fulfills with the api response", async () => {
    api.mockResolvedValue(data);

    const action = await run(makeStore());

    expect(api).toHaveBeenCalledWith(...expectedArgs);
    expect(action.type.endsWith("/fulfilled")).toBe(true);
    expect(action.payload).toEqual(data);
  });

  it("rejects with the message sent by the server", async () => {
    api.mockRejectedValue(apiFailure("Server says no"));

    const action = await run(makeStore());

    expect(action.type.endsWith("/rejected")).toBe(true);
    expect(action.payload).toBe("Server says no");
  });

  it("rejects with the first message when the server sends a list", async () => {
    api.mockRejectedValue(apiFailure(["first", "second"]));

    const action = await run(makeStore());

    expect(action.payload).toBe("first");
  });

  it("rejects with the fallback message for a non-api error", async () => {
    api.mockRejectedValue(new Error("network down"));

    const action = await run(makeStore());

    expect(action.type.endsWith("/rejected")).toBe(true);
    expect(action.payload).toBe(fallback);
  });
};
