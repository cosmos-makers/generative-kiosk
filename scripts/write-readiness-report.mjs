import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const target =
  process.env.READINESS_REPORT_PATH ||
  path.join(process.cwd(), "test-results", "readiness-report-latest.md");

const child = spawn("node", ["scripts/readiness-report.mjs"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: ["ignore", "pipe", "inherit"],
});

let output = "";
child.stdout.on("data", (chunk) => {
  output += chunk.toString();
});

await new Promise((resolve, reject) => {
  child.on("exit", (code) => {
    if (code === 0) resolve();
    else reject(new Error(`readiness-report exited with code ${code}`));
  });
  child.on("error", reject);
});

await mkdir(path.dirname(target), { recursive: true });
await writeFile(target, output);
console.log(`Wrote readiness report to ${target}`);
