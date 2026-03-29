import { expect, test } from "@playwright/test";

async function completeGenUIOrder(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "도움 제안" }).click();
  await page.getByRole("button", { name: /큰 글씨 AI 화면/i }).click();
  await page.getByRole("button", { name: /포장하기/i }).click();
  await page.getByRole("button", { name: /장바구니 담기/i }).first().click();
  await page.getByRole("button", { name: /큰 글씨 결제로 이동|장바구니 검토로 이동/i }).click();
  await page.getByRole("button", { name: /도움 모드로 주문 완료/i }).click();
  await expect(page.getByText(/주문번호/)).toBeVisible({ timeout: 10000 });
}

async function completeVoiceOrder(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "도움 제안" }).click();
  await page.getByRole("button", { name: /음성 안내 주문/i }).click();
  await page.getByRole("button", { name: /마이크 권한 확인 후 시작/i }).click();
  const input = page.getByPlaceholder(/빅맥 세트 담아줘/i);
  await input.fill("빅맥 세트 담아줘");
  await page.getByRole("button", { name: "실행" }).click();
  await expect(page.getByRole("heading", { name: /빅맥/i }).first()).toBeVisible();
  await input.fill("이제 결제할게");
  await page.getByRole("button", { name: "실행" }).click();
  await expect(page.getByRole("button", { name: /장바구니 확인 후 바로 주문 완료/i })).toBeVisible();
  await page.getByRole("button", { name: /장바구니 확인 후 바로 주문 완료/i }).click();
  await expect(page.getByText(/주문번호/)).toBeVisible({ timeout: 10000 });
}

test("debug overlay can launch GenUI flow without breaking checkout", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Live build/i)).toBeVisible();
  await page.getByRole("button", { name: /debug off/i }).click();
  await expect(page.getByText(/Debug overlay/i)).toBeVisible();
  await completeGenUIOrder(page);
});

test("voice flow remains reachable with typed fallback when speech recognition is unavailable", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /debug off/i }).click();
  await completeVoiceOrder(page);
});

test("session can replay GenUI then voice flows without leaking mode state", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /debug off/i }).click();
  await completeGenUIOrder(page);
  await page.getByRole("button", { name: /처음으로/i }).click();

  await expect(page.getByRole("heading", { name: /MDonald Barrier-Free Kiosk/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /debug on/i })).toBeVisible();

  await completeVoiceOrder(page);
});

test("repeated replay cycles keep debug split and adaptive flows stable", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /debug off/i }).click();

  for (let cycle = 0; cycle < 3; cycle += 1) {
    await completeGenUIOrder(page);
    await page.getByRole("button", { name: /처음으로/i }).click();
    await expect(page.getByRole("heading", { name: /MDonald Barrier-Free Kiosk/i })).toBeVisible();

    await completeVoiceOrder(page);
    await page.getByRole("button", { name: /처음으로/i }).click();
    await expect(page.getByRole("heading", { name: /MDonald Barrier-Free Kiosk/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /debug on/i })).toBeVisible();
  }
});
