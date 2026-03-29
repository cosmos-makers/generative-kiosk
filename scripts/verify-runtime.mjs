import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const port = 3110;
const baseUrl = `http://127.0.0.1:${port}`;
const soakCycles = Number(process.env.RUNTIME_SOAK_CYCLES ?? "2");
const reportPath =
  process.env.RUNTIME_VERIFY_REPORT_PATH ||
  path.join(process.cwd(), "test-results", "runtime-verify-report.json");
const historyPath =
  process.env.RUNTIME_VERIFY_HISTORY_PATH ||
  path.join(process.cwd(), ".omx", "logs", "runtime-verify-history.json");
const legacyHistoryPath = path.join(
  process.cwd(),
  "test-results",
  "runtime-verify-history.json",
);

function startDevServer() {
  const child = spawn("npm", ["run", "dev", "--", "--port", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
    cwd: process.cwd(),
    env: { ...process.env, NEXT_DIST_DIR: ".next-runtime" },
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
  });

  return child;
}

async function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await delay(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function probeApi(path, body) {
  const res = await fetch(baseUrl + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function probeUi() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: /debug off|debug on/i }).click();
    await page.waitForTimeout(500);
    return (await page.textContent("body"))?.slice(0, 500) ?? "";
  } finally {
    await browser.close();
  }
}

async function ensureDebugOverlay(page) {
  const toggle = page.getByRole("button", { name: /debug off|debug on/i });
  await toggle.waitFor();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await toggle.click();
    try {
      await page.getByText(/Debug overlay/i).waitFor({ timeout: 5000 });
      return;
    } catch {
      if (attempt === 2) {
        throw new Error("Failed to open debug overlay");
      }
    }
  }
}

async function runReplaySoak(cycles = soakCycles) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await ensureDebugOverlay(page);

    for (let cycle = 0; cycle < cycles; cycle += 1) {
      await page.getByRole("button", { name: "도움 제안" }).waitFor();
      await page.getByRole("button", { name: "도움 제안" }).click();
      await page.getByRole("button", { name: /큰 글씨 AI 화면/i }).click();
      await page.getByRole("button", { name: /포장하기/i }).click();
      await page.getByRole("button", { name: /장바구니 담기/i }).first().click();
      await page.getByRole("button", { name: /큰 글씨 결제로 이동|장바구니 검토로 이동/i }).click();
      await page.getByRole("button", { name: /도움 모드로 주문 완료/i }).click();
      await page.getByText(/주문번호/).waitFor();
      await page.getByRole("button", { name: /처음으로/i }).click();
      await page.getByRole("heading", { name: /MDonald Barrier-Free Kiosk/i }).waitFor();

      await page.getByRole("button", { name: "도움 제안" }).click();
      await page.getByRole("button", { name: /음성 안내 주문/i }).click();
      await page.getByRole("button", { name: /마이크 권한 확인 후 시작/i }).click();
      const input = page.getByPlaceholder(/빅맥 세트 담아줘/i);
      await input.fill("빅맥 세트 담아줘");
      await page.getByRole("button", { name: "실행" }).click();
      await page.getByRole("heading", { name: /빅맥/i }).first().waitFor();
      await input.fill("이제 결제할게");
      await page.getByRole("button", { name: "실행" }).click();
      await page.getByRole("button", { name: /장바구니 확인 후 바로 주문 완료/i }).waitFor();
      await page.getByRole("button", { name: /장바구니 확인 후 바로 주문 완료/i }).click();
      await page.getByText(/주문번호/).waitFor();
      await page.getByRole("button", { name: /처음으로/i }).click();
      await page.getByRole("heading", { name: /MDonald Barrier-Free Kiosk/i }).waitFor();
      await page.getByRole("button", { name: /debug on/i }).waitFor();
    }

    return { cycles, stable: true };
  } finally {
    await browser.close();
  }
}

const child = startDevServer();

try {
  await waitForServer(baseUrl);

  const orders = await probeApi("/api/orders", { items: [{ id: 1 }] });
  const voice = await probeApi("/api/voice-order", {
    transcript: "빅맥 세트 두 개 담아줘",
    difficultyScore: 75,
    currentStep: "items",
    cartItems: [{ id: 178, quantity: 1 }],
  });
  const gen = await probeApi("/api/gen-ui", {
    difficultyScore: 80,
    step: "items",
    context: {
      category: "버거",
      orderType: "takeout",
      cartSummary: ["빅맥 세트 x1"],
    },
  });
  const bodyText = await probeUi();
  const soak = await runReplaySoak();

  const report = {
    generatedAt: new Date().toISOString(),
    orders: {
      status: orders.status,
      orderNumber: orders.json.orderNumber,
    },
    voice: {
      status: voice.status,
      action: voice.json.action,
      targetItemId: voice.json.targetItemId,
      quantity: voice.json.quantity,
    },
    gen: {
      status: gen.status,
      title: gen.json.title,
      ctaLabel: gen.json.ctaLabel,
    },
    ui: {
      debugOverlaySeen: bodyText.includes("Debug overlay"),
    },
    soak,
  };

  let history = [];
  try {
    history = JSON.parse(await readFile(historyPath, "utf8"));
    if (!Array.isArray(history)) {
      history = [];
    }
  } catch {
    try {
      history = JSON.parse(await readFile(legacyHistoryPath, "utf8"));
      if (!Array.isArray(history)) {
        history = [];
      }
    } catch {
      history = [];
    }
  }

  history.push(report);

  await mkdir(path.dirname(reportPath), { recursive: true });
  await mkdir(path.dirname(historyPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  await writeFile(historyPath, JSON.stringify(history, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log(`runtime verify report written to ${reportPath}`);
  console.log(`runtime verify history written to ${historyPath}`);
} finally {
  child.kill("SIGTERM");
}
