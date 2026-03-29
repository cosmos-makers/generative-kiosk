import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const stamp = new Date().toISOString().replace(/[:]/g, "-");
const targetDir = path.join(process.cwd(), "test-results", "manual-device-logs");
const source = path.join(
  process.cwd(),
  "scripts",
  "templates",
  "manual-device-verification-template.md",
);
const target = path.join(targetDir, `manual-device-verification-${stamp}.md`);

await mkdir(targetDir, { recursive: true });
await copyFile(source, target);

console.log(target);
