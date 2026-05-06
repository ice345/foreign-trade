import { test, expect } from "@playwright/test";

test("homepage loads and displays hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("text=GlobalPush")).toBeVisible();
});

test("navigation links are visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("text=资源探索")).toBeVisible();
});

test("login page is accessible", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("input")).toHaveCount(2);
});

test("explore page loads resources", async ({ page }) => {
  await page.goto("/explore");
  await expect(page.locator("text=资源探索")).toBeVisible();
});
