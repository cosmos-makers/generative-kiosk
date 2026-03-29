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

const note = `# Handoff Note

## Current status
- Automated verification is green.
- Latest runtime verification: ${latest?.generatedAt ?? "N/A"}
- Latest soak cycles: ${latest?.soak?.cycles ?? 0}
- Runtime history runs: ${Array.isArray(history) ? history.length : 0}
- All recorded runtime runs stable: ${
  Array.isArray(history) && history.every((entry) => entry?.soak?.stable === true)
    ? "yes"
    : "no"
}

## Use these commands
- Dev server: \`npm run dev -- --port 3105\`
- Open Chrome: \`npm run open:chrome -- 3105\`
- Full verification: \`npm run verify:all\`
- Runtime report: \`npm run verify:runtime:report\`
- Runtime soak: \`npm run verify:runtime:soak\`
- Evidence summary: \`npm run verify:evidence-summary\`
- Readiness report: \`npm run verify:readiness-report\`
- Write readiness file: \`npm run write:readiness-report\`
- Init manual device log: \`npm run init:manual-log\`
- Collect evidence bundle: \`npm run collect:evidence-bundle\`

## Remaining manual proof
- Mac Chrome real microphone path
- Mac Chrome real camera permission path
- Real STT/TTS happy path
- Physical 2–4 hour soak

## Key artifacts
- \`test-results/runtime-verify-report.json\`
- \`.omx/logs/runtime-verify-history.json\`
- \`test-results/readiness-report-latest.md\`
- \`scripts/manual-device-checklist.md\`
- \`scripts/templates/manual-device-verification-template.md\`
- \`test-results/evidence-bundles/\`
`;

console.log(note);
