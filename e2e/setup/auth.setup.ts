/**
 * Global auth setup — runs once before authenticated E2E tests.
 *
 * Set TEST_EMAIL and TEST_PASSWORD env vars (e.g. in .env.test.local)
 * to a real Supabase test account.  When the vars are absent the setup
 * saves an empty session so the kanban spec can skip itself gracefully.
 *
 * The session file is gitignored; it is never committed to the repo.
 */

import path from "path";
import { test as setup, expect } from "@playwright/test";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.join(__dirname, "../../.playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  const email = process.env["TEST_EMAIL"];
  const password = process.env["TEST_PASSWORD"];

  if (!email || !password) {
    // Persist an empty session — authenticated tests will skip themselves.
    await page.context().storageState({ path: AUTH_FILE });
    return;
  }

  await page.goto("/login");

  await page.getByRole("textbox", { name: /email/i }).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait until the router leaves /login (boards page loads at "/")
  await expect(page).toHaveURL("/", { timeout: 15_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
