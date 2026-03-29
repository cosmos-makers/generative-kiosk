import { readFile } from "node:fs/promises";

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

const latest = await readJson("test-results/runtime-verify-report.json", null);
const history = await readJson(".omx/logs/runtime-verify-history.json", []);

const summary = {
  latestGeneratedAt: latest?.generatedAt ?? null,
  latestStable: latest?.soak?.stable ?? null,
  latestCycles: latest?.soak?.cycles ?? null,
  historyRuns: Array.isArray(history) ? history.length : 0,
  allHistoryStable: Array.isArray(history)
    ? history.every((entry) => entry?.soak?.stable === true)
    : false,
  maxHistoryCycles: Array.isArray(history)
    ? history.reduce((max, entry) => Math.max(max, entry?.soak?.cycles ?? 0), 0)
    : 0,
};

console.log(JSON.stringify(summary, null, 2));
