import { expect, test, type Page } from "@playwright/test";
import menuData from "../src/data/menu.json";

type Locale = "ko" | "en";
type OrderType = "dine-in" | "takeout";

type CategorySeed = { seq: number; categoryName: string; itemId: number; itemName: string };

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const categorySeeds: CategorySeed[] = menuData.categories.slice(0, 5).flatMap((category) =>
  category.items.slice(0, 5).map((item) => ({
    seq: category.seq,
    categoryName: stripHtml(category.korName),
    itemId: item.id,
    itemName: stripHtml(item.korName),
  })),
);

const userScenarios = categorySeeds.flatMap((seed, index) =>
  (["dine-in", "takeout"] as const).map((orderType) => ({
    id: `user-${index + 1}-${orderType}`,
    locale: "ko" as const,
    orderType,
    ...seed,
  })),
);

const thresholds = [58, 64, 70, 76, 82] as const;
const sensitivities = [2, 4, 6, 8, 10] as const;
const genUiScenarios = thresholds.flatMap((threshold, thresholdIndex) =>
  sensitivities.map((sensitivity, sensitivityIndex) => ({
    id: `demo-genui-${threshold}-${sensitivity}`,
    locale: (thresholdIndex % 2 === 0 ? "ko" : "en") as Locale,
    orderType: (sensitivityIndex % 2 === 0 ? "dine-in" : "takeout") as OrderType,
    threshold,
    sensitivity,
  })),
);

const voiceScenarios = categorySeeds.map((seed, index) => ({
  id: `demo-voice-${index + 1}`,
  locale: (index % 2 === 0 ? "ko" : "en") as Locale,
  orderType: (index % 3 === 0 ? "takeout" : "dine-in") as OrderType,
  addCommand: `${seed.itemName} 하나 줘`,
  checkoutCommand: "이제 결제할게",
}));

async function openKiosk(page: Page, locale: Locale) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /debug off|debug on/i })).toBeVisible();
  if (locale === "en") {
    await page.getByRole("button", { name: /^EN$/ }).click();
  }
}

async function chooseOrderType(page: Page, orderType: OrderType) {
  await page.getByRole("button", {
    name: orderType === "dine-in" ? /매장에서 먹기|eat here/i : /포장하기|take out/i,
  }).click();
}

async function chooseCategory(page: Page, categoryName: string) {
  await page
    .locator("aside")
    .first()
    .getByRole("button", { name: new RegExp(escapeRegExp(categoryName), "i") })
    .click();
}

async function addMenuItem(page: Page, itemName: string) {
  await page.getByRole("button", { name: new RegExp(escapeRegExp(itemName), "i") }).first().click();
}

async function completeNormalOrder(page: Page) {
  await page.getByRole("button", { name: /주문 완료|review & pay/i }).click();
  await page.getByRole("button", { name: /결제 완료|complete payment/i }).click();
  await expect(page.getByText(/주문번호/)).toBeVisible();
}

async function enableDebug(page: Page) {
  const toggle = page.getByRole("button", { name: /debug off|debug on/i });
  if ((await toggle.textContent())?.toLowerCase().includes("off")) {
    await toggle.click();
  }
  await expect(page.getByTestId("debug-panel")).toBeVisible();
}

async function setCalibration(page: Page, threshold: number, sensitivity: number) {
  const sliders = page.locator('input[type="range"]');
  await sliders.nth(0).evaluate((input, next) => {
    const element = input as HTMLInputElement;
    element.value = String(next);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }, threshold);
  await sliders.nth(1).evaluate((input, next) => {
    const element = input as HTMLInputElement;
    element.value = String(next);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }, sensitivity);
}

async function openHelp(page: Page) {
  await page.getByRole("button", { name: /도움 제안/i }).click({ force: true });
  await expect(page.getByTestId("help-mode-large-ui")).toBeVisible();
}

async function completeGenUiOrder(page: Page) {
  await page.getByTestId("help-mode-large-ui").click();
  await expect(page.getByText(/Adaptive trace/i)).toBeVisible();
  const addButton = page.getByRole("button", { name: /장바구니 담기/i }).first();
  if (await addButton.isVisible().catch(() => false)) {
    await addButton.click({ force: true });
  }
  await expect(page.getByRole("button", { name: /큰 글씨 결제로 이동|장바구니 검토로 이동/i })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("button", { name: /큰 글씨 결제로 이동|장바구니 검토로 이동/i })).toBeEnabled({ timeout: 10000 });
}

async function completeVoiceOrder(page: Page, addCommand: string, checkoutCommand: string) {
  await page.getByTestId("help-mode-voice").click();
  await page.getByTestId("voice-permission-start").click({ force: true });
  const input = page.getByTestId("voice-typed-input");
  await expect(input).toBeVisible({ timeout: 10000 });
  await input.fill(addCommand);
  await input.press("Enter");
  await input.fill(checkoutCommand);
  await input.press("Enter");
  await expect(page.getByTestId("voice-complete-order")).toBeVisible({ timeout: 10000 });
  await page.getByTestId("voice-complete-order").click({ force: true });
  await expect(page.getByText(/주문번호/)).toBeVisible();
}

test.describe("scenario matrix", () => {
  for (const scenario of userScenarios) {
    test(`[user] ${scenario.id}`, async ({ page }) => {
      await openKiosk(page, scenario.locale);
      await chooseOrderType(page, scenario.orderType);
      await chooseCategory(page, scenario.categoryName);
      await addMenuItem(page, scenario.itemName);
      await completeNormalOrder(page);
    });
  }

  for (const scenario of genUiScenarios) {
    test(`[demo-genui] ${scenario.id}`, async ({ page }) => {
      await openKiosk(page, scenario.locale);
      await chooseOrderType(page, scenario.orderType);
      await page.locator('[data-testid^="menu-item-"]').first().click();
      await enableDebug(page);
      await setCalibration(page, scenario.threshold, scenario.sensitivity);
      await openHelp(page);
      await completeGenUiOrder(page);
    });
  }

  for (const scenario of voiceScenarios) {
    test(`[demo-voice] ${scenario.id}`, async ({ page }) => {
      await openKiosk(page, scenario.locale);
      await chooseOrderType(page, scenario.orderType);
      await enableDebug(page);
      await openHelp(page);
      await completeVoiceOrder(page, scenario.addCommand, scenario.checkoutCommand);
    });
  }
});
