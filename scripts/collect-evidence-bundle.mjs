import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const stamp = new Date().toISOString().replace(/[:]/g, "-");
const root = process.cwd();
const bundleDir = path.join(root, "test-results", "evidence-bundles", stamp);

const files = [
  ["test-results/runtime-verify-report.json", "runtime-verify-report.json"],
  [".omx/logs/runtime-verify-history.json", "runtime-verify-history.json"],
  ["test-results/readiness-report-latest.md", "readiness-report-latest.md"],
  ["test-results/handoff-note-latest.md", "handoff-note-latest.md"],
  ["scripts/manual-device-checklist.md", "manual-device-checklist.md"],
  [
    "scripts/templates/manual-device-verification-template.md",
    "manual-device-verification-template.md",
  ],
];

await mkdir(bundleDir, { recursive: true });

const copied = [];
for (const [source, targetName] of files) {
  const from = path.join(root, source);
  const to = path.join(bundleDir, targetName);
  await copyFile(from, to);
  copied.push({ source, target: `test-results/evidence-bundles/${stamp}/${targetName}` });
}

const manifest = {
  generatedAt: new Date().toISOString(),
  bundleDir: `test-results/evidence-bundles/${stamp}`,
  files: copied,
};

await writeFile(
  path.join(bundleDir, "manifest.json"),
  JSON.stringify(manifest, null, 2),
);

console.log(JSON.stringify(manifest, null, 2));
