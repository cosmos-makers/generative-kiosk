import { expect, test } from "@playwright/test";

test("home renders McDonald-style shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /debug off/i })).toBeVisible();
  await expect(page.getByText(/맥도날드 스타일 키오스크|McDonald-style kiosk/i)).toBeVisible();
});

test("debug page renders calibration observatory", async ({ page }) => {
  await page.goto("/debug");
  await expect(page.getByText(/MediaPipe \+ GenUI 데이터 흐름 관측실/)).toBeVisible();
});
