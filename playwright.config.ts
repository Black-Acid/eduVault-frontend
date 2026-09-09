import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end configuration.
 *
 * By default this builds nothing and simply serves the existing production
 * build (`npm run start`), so the suite exercises the same output that ships -
 * not `next dev`.
 *
 * Point E2E_BASE_URL at a running instance (a staging deployment, say) to test
 * that instead; the local server is then not started.
 *
 * Credentials for the authenticated specs come from the environment and are
 * never committed. Without them, those specs skip rather than fail - and they
 * should point at a staging account, not at real student data.
 */

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const usesExternalServer = Boolean(process.env.E2E_BASE_URL);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],

  webServer: usesExternalServer
    ? undefined
    : {
        command: "npm run start",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
