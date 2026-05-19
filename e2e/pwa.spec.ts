import { test, expect } from "@playwright/test";

test.describe("PWA manifest", () => {
  test("has web app manifest linked in head", async ({ page }) => {
    await page.goto("/login");
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveCount(1);
  });

  test("has theme-color meta tag", async ({ page }) => {
    await page.goto("/login");
    const themeMeta = page.locator('meta[name="theme-color"]');
    await expect(themeMeta).toHaveCount(1);
  });

  test("has apple-touch-icon", async ({ page }) => {
    await page.goto("/login");
    const appleIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleIcon).toHaveCount(1);
  });
});
