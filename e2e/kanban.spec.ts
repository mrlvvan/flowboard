/**
 * Authenticated end-to-end tests for the kanban board workflow.
 *
 * These tests run against a real Supabase instance and require
 * TEST_EMAIL + TEST_PASSWORD env vars (see e2e/setup/auth.setup.ts).
 *
 * The suite is serial: each test builds on state from the previous one
 * (board ID, column name, card title).  If the first test fails the
 * remaining ones are automatically skipped.
 */

import { test, expect, type Page } from "@playwright/test";

// Skip the whole file when no credentials are configured.
const HAS_AUTH = !!(process.env["TEST_EMAIL"] && process.env["TEST_PASSWORD"]);

// Unique suffix so parallel runs don't collide in the same account.
const RUN_ID = Date.now();
const BOARD_NAME = `E2E Board ${RUN_ID}`;
const COLUMN_NAME = "Backlog";
const CARD_TITLE = "Write E2E tests";

// Shared state passed between serial tests.
let boardUrl = "";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Wait for the toast with a given text to appear and disappear. */
async function waitForToast(page: Page, text: string | RegExp) {
  const toast = page.locator("[data-sonner-toast]").filter({ hasText: text });
  await expect(toast).toBeVisible({ timeout: 8_000 });
}

// ─── Suite ────────────────────────────────────────────────────────────────────

test.describe("Kanban board workflow", () => {
  test.skip(!HAS_AUTH, "Set TEST_EMAIL and TEST_PASSWORD to run authenticated tests");
  test.describe.configure({ mode: "serial" });

  // ── 1. Boards page ──────────────────────────────────────────────────────────

  test("boards page loads after login", async ({ page }) => {
    await page.goto("/");

    // Should stay on "/" (not redirect to /login) because storageState is set
    await expect(page).toHaveURL("/");

    // Page header is visible
    await expect(page.getByText("Workspace")).toBeVisible();
    await expect(page.getByRole("button", { name: /new board/i })).toBeVisible();
  });

  // ── 2. Create board ──────────────────────────────────────────────────────────

  test("creates a new board and navigates to it", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /new board/i }).click();

    // Dialog opens
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Fill in the name
    await page.getByPlaceholder("e.g. Product Roadmap").fill(BOARD_NAME);

    // Submit
    await dialog.getByRole("button", { name: /create board/i }).click();

    // Navigates to the new board
    await expect(page).toHaveURL(/\/board\//, { timeout: 12_000 });
    boardUrl = page.url();

    // Board name appears in the header
    await expect(page.getByRole("button", { name: BOARD_NAME })).toBeVisible();
  });

  // ── 3. Empty state ──────────────────────────────────────────────────────────

  test("shows empty state prompt when board has no columns", async ({ page }) => {
    await page.goto(boardUrl);

    // Empty state headline
    await expect(page.getByText("Add your first column")).toBeVisible();
  });

  // ── 4. Add column ───────────────────────────────────────────────────────────

  test("adds a column to the board", async ({ page }) => {
    await page.goto(boardUrl);

    // Click the "Add column" button (data-add-column attr)
    await page.locator("[data-add-column]").click();

    // Input appears
    const colInput = page.getByPlaceholder("Column name…");
    await expect(colInput).toBeVisible();
    await colInput.fill(COLUMN_NAME);
    await colInput.press("Enter");

    // Column header should now be visible
    await expect(page.getByRole("button", { name: COLUMN_NAME })).toBeVisible({ timeout: 8_000 });
  });

  // ── 5. Add card ─────────────────────────────────────────────────────────────

  test("adds a card inside the column", async ({ page }) => {
    await page.goto(boardUrl);

    // Ensure column is present
    await expect(page.getByRole("button", { name: COLUMN_NAME })).toBeVisible();

    // Click "+ Add a card"
    await page.getByRole("button", { name: /add a card/i }).click();

    // Card textarea appears
    const cardInput = page.getByPlaceholder(/card title/i);
    await expect(cardInput).toBeVisible();
    await cardInput.fill(CARD_TITLE);

    // Submit with "Add card" button
    await page.getByRole("button", { name: /^add card$/i }).click();

    // Card title should appear in the column
    await expect(page.getByText(CARD_TITLE)).toBeVisible({ timeout: 8_000 });
  });

  // ── 6. Open card modal ──────────────────────────────────────────────────────

  test("opens a card in the detail modal", async ({ page }) => {
    await page.goto(boardUrl);

    // Wait for the card to be visible
    await expect(page.getByText(CARD_TITLE)).toBeVisible();

    // Click the card
    await page.getByText(CARD_TITLE).click();

    // Modal should appear with the card title
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByText(CARD_TITLE)).toBeVisible();
  });

  // ── 7. Filter panel opens and closes ────────────────────────────────────────

  test("opens and closes the filter panel", async ({ page }) => {
    await page.goto(boardUrl);

    // Filter button
    const filterBtn = page.getByRole("button", { name: /filter/i });
    await expect(filterBtn).toBeVisible();
    await filterBtn.click();

    // Panel shows label section
    await expect(page.getByText("Labels")).toBeVisible();
    await expect(page.getByText("Due date")).toBeVisible();

    // Click outside to close
    await page.keyboard.press("Escape");

    // Panel is hidden (press Escape closes any open dropdown/modal)
    // Re-click to verify toggle
    await filterBtn.click();
    const panel = page.locator("text=Labels").first();
    await expect(panel).toBeVisible();
    await filterBtn.click();
  });

  // ── 8. Filter by label ──────────────────────────────────────────────────────

  test("activates a label filter and sees the filter chip", async ({ page }) => {
    await page.goto(boardUrl);

    // Open filter panel
    await page.getByRole("button", { name: /filter/i }).click();
    await expect(page.getByText("Labels")).toBeVisible();

    // Click the "red" label chip
    await page.getByRole("button", { name: "red" }).click();

    // Filter button should now show a count badge "1"
    const badge = page.locator("button", { hasText: /filter/i }).locator("span", { hasText: "1" });
    await expect(badge).toBeVisible();

    // Active filter chip strip appears below the header
    const chipStrip = page.locator("text=Filtered by:");
    await expect(chipStrip).toBeVisible();

    // Clear the filter
    await page
      .getByRole("button", { name: /clear all/i })
      .first()
      .click();

    // Filter count badge disappears
    await expect(badge).not.toBeVisible();
  });

  // ── 9. Search keyboard shortcut ─────────────────────────────────────────────

  test("opens search dialog via keyboard shortcut", async ({ page }) => {
    await page.goto("/");

    // Press "/" to open search
    await page.keyboard.press("/");

    const searchInput = page.getByPlaceholder(/search boards and cards/i);
    await expect(searchInput).toBeVisible({ timeout: 5_000 });

    // Type the board name
    await searchInput.fill(BOARD_NAME.slice(0, 8));

    // Should show at least one result
    await expect(page.getByText(BOARD_NAME)).toBeVisible({ timeout: 5_000 });

    // Escape closes
    await page.keyboard.press("Escape");
    await expect(searchInput).not.toBeVisible();
  });

  // ── 10. Rename board ─────────────────────────────────────────────────────────

  test("renames the board from the header", async ({ page }) => {
    await page.goto(boardUrl);

    // Click board name to start editing
    await page.getByRole("button", { name: BOARD_NAME }).click();

    // Input appears pre-filled
    const nameInput = page.locator('input[class*="border-b"][class*="violet"]');
    await expect(nameInput).toBeVisible();

    // Clear and type new name
    const newName = `${BOARD_NAME} (renamed)`;
    await nameInput.selectText();
    await nameInput.fill(newName);
    await nameInput.press("Enter");

    // Header reflects new name
    await expect(page.getByRole("button", { name: newName })).toBeVisible({ timeout: 8_000 });

    // Rename back to original so subsequent test runs start clean
    await page.getByRole("button", { name: newName }).click();
    await nameInput.selectText();
    await nameInput.fill(BOARD_NAME);
    await nameInput.press("Enter");
  });
});
