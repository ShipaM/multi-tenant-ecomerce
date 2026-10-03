import { renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";

import authReducer from "@/store/auth/authSlice";

type DispatchOutcome = { resolves: unknown } | { rejects: unknown };

/**
 * Renders a hook against a store whose every dispatched thunk settles with the given outcome.
 *
 * Real thunks always reject with a string or resolve with a well-formed response, so the defensive
 * branches in hooks (an unexpected error shape, an unrecognised response) cannot be reached through the API mock.
 */
export function renderHookWithDispatchOutcome<T>(
  hook: () => T,
  outcome: DispatchOutcome,
) {
  const store = configureStore({
    reducer: { auth: authReducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(() => () => () => ({
        unwrap: () =>
          "rejects" in outcome
            ? Promise.reject(outcome.rejects)
            : Promise.resolve(outcome.resolves),
      })),
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter useTransitions={false}>{children}</MemoryRouter>
    </Provider>
  );

  return renderHook(hook, { wrapper });
}
