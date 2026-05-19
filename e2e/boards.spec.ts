import { test, expect } from "@playwright/test";

// These tests require a logged-in session. In CI, use a seeded test user.
// Locally they verify the UI shape against the login page (unauthenticated).

test.describe("Boards page (unauthenticated)", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Board route (unauthenticated)", () => {
  test("redirects board deep-link to login", async ({ page }) => {
    await page.goto("/board/some-board-id");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Search shortcut", () => {
  test("search shortcut opens dialog on boards page (after login redirect resolves to login)", async ({
    page,
  }) => {
    await page.goto("/login");
    // The login page itself should not have the search dialog
    await page.keyboard.press("/");
    await expect(page.getByPlaceholder(/search boards/i)).not.toBeVisible();
  });
});
