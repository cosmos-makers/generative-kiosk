import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:3002",
    trace: "on-first-retry",
    viewport: { width: 1600, height: 1000 },
  },
  webServer: {
    command: "NEXT_DIST_DIR=.next-e2e npm run dev -- --port 3002",
    url: "http://127.0.0.1:3002",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
