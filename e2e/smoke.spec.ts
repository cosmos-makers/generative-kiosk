import { test, expect } from "@playwright/test";
test("debug toggle keeps product running while showing overlay", async ({ page }) => { await page.goto("/"); await expect(page.getByRole("button", { name:/debug off/i })).toBeVisible(); await page.getByRole("button", { name:/debug off/i }).click(); await expect(page.getByText(/Debug overlay/)).toBeVisible(); });
