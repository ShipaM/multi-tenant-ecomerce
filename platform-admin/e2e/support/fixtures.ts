import { test as base, expect } from "@playwright/test";
import { ApiMock } from "./api-mock";

type Fixtures = {
  // Backend mock. Automatically connected in every test.
  api: ApiMock;
  // Makes the user authenticated by storing tokens in localStorage before the app starts.
  signedIn: void;
};

// The fixture parameter is named `run`, not `use`: the react-hooks/rules-of-hooks
// rule treats `use(...)` as a React Hook and reports an error.
export const test = base.extend<Fixtures>({
  api: async ({ page }, run) => {
    const api = new ApiMock(page);
    await api.start();
    await run(api);
  },
  signedIn: [
    async ({ page, api }, run) => {
      api.withSignedInDefaults();
      await page.addInitScript(() => {
        // Flag in sessionStorage: tokens are set only once per tab. Otherwise, after
        // logging out and reloading, the init script would log the user in again.
        if (sessionStorage.getItem("e2e-seeded")) return;
        sessionStorage.setItem("e2e-seeded", "1");
        localStorage.setItem("ACCESS_TOKEN", "e2e-access-token");
        localStorage.setItem("REFRESH_TOKEN", "e2e-refresh-token");
        localStorage.setItem("USER_TYPE", "PLATFORM_ADMIN");
      });
      await run();
    },
    { auto: false },
  ],
});

export { expect };
