import { defineConfig, devices } from "@playwright/test";

/**
 * Auth state is stored here after the `setup` project runs.
 * The file is gitignored so credentials never end up in source control.
 */
const AUTH_FILE = ".playwright/.auth/user.json";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    /**
     * Auth setup — runs once, saves Supabase session to AUTH_FILE.
     * Requires TEST_EMAIL + TEST_PASSWORD env vars. Skips gracefully when absent.
     */
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },

    /**
     * Unauthenticated tests (auth redirects, login form, PWA metadata).
     * These deliberately run without stored session state.
     */
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: { cookies: [], origins: [] },
      },
      testIgnore: /kanban\.spec\.ts/,
    },

    /**
     * Authenticated workflow tests — depend on the setup project.
     * Only the kanban spec uses this project.
     */
    {
      name: "chromium-auth",
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_FILE,
      },
      dependencies: ["setup"],
      testMatch: /kanban\.spec\.ts/,
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env["CI"],
  },
});
