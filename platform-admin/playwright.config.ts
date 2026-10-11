import { defineConfig, devices } from "@playwright/test";

// A separate port for E2E doesn’t interfere with yours `npm run dev` (порт 3002).
const PORT = 3102;

const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // The SPA uses the same origin as the page with the /api prefix.
      // Tests intercept all these requests with page.route, so a real backend is not needed.
      VITE_APP_API_BASE_URL: `${BASE_URL}/api`,
    },
  },
});
