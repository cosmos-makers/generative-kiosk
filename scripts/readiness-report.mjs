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

const lines = [
  "# Readiness Report",
  "",
  `- Latest runtime verification: ${latest?.generatedAt ?? "N/A"}`,
  `- Latest runtime stable: ${latest?.soak?.stable === true ? "yes" : "no"}`,
  `- Latest soak cycles: ${latest?.soak?.cycles ?? 0}`,
  `- Runtime history runs: ${Array.isArray(history) ? history.length : 0}`,
  `- All history stable: ${
    Array.isArray(history) && history.every((entry) => entry?.soak?.stable === true)
      ? "yes"
      : "no"
  }`,
  `- Max recorded soak cycles: ${
    Array.isArray(history)
      ? history.reduce((max, entry) => Math.max(max, entry?.soak?.cycles ?? 0), 0)
      : 0
  }`,
  "",
  "## Automated proof",
  "- `npm run verify:all`",
  "- `npm run verify:runtime:report`",
  "- `npm run verify:evidence-summary`",
  "",
  "## Remaining manual proof",
  "- Mac Chrome real microphone path",
  "- Mac Chrome real camera permission path",
  "- Real STT/TTS happy path",
  "- Physical 2–4 hour soak",
  "",
  "## Manual artifacts",
  "- Checklist: `scripts/manual-device-checklist.md`",
  "- Template: `scripts/templates/manual-device-verification-template.md`",
  "- Timestamped log: `npm run init:manual-log`",
];

console.log(lines.join("\n"));
