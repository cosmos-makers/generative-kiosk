import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const port = process.argv[2] ?? process.env.PORT ?? "3105";
const url = `http://localhost:${port}`;

await execFileAsync("open", ["-a", "Google Chrome", url]);
console.log(`Opened ${url} in Google Chrome`);
