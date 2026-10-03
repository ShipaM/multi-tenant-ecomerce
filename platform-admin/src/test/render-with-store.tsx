import { render } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import type { ReactElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";

import authReducer from "@/store/auth/authSlice";
import type { AuthState } from "@/store/auth/auth.types";

type Outcome = { resolves: unknown } | { rejects: unknown };

type Options = {
  /** Overrides for the auth slice before the first render. */
  auth?: Partial<AuthState>;
  /**
   * Makes dispatched thunks settle with this outcome instead of calling the API. A list is used one
   * outcome per dispatch, the last one repeating.
   */
  dispatchOutcome?: Outcome | Outcome[];
  route?: string;
};

/** Renders a component against the real auth reducer, inside a router. */
export function renderWithStore(
  ui: ReactElement,
  { auth = {}, dispatchOutcome, route = "/" }: Options = {},
) {
  const outcomes = Array.isArray(dispatchOutcome)
    ? [...dispatchOutcome]
    : dispatchOutcome
      ? [dispatchOutcome]
      : [];
  const nextOutcome = (): Outcome =>
    (outcomes.length > 1 ? outcomes.shift() : outcomes[0]) as Outcome;

  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { ...authReducer(undefined, { type: "@@INIT" }), ...auth },
    },
    middleware: (getDefaultMiddleware) =>
      outcomes.length > 0
        ? getDefaultMiddleware().prepend(() => () => () => {
            const outcome = nextOutcome();
            return {
              unwrap: () =>
                "rejects" in outcome
                  ? Promise.reject(outcome.rejects)
                  : Promise.resolve(outcome.resolves),
            };
          })
        : getDefaultMiddleware(),
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]} useTransitions={false}>
          {ui}
        </MemoryRouter>
      </Provider>,
    ),
  };
}
