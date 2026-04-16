import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configFile = resolve(root, "public", "config.js");

const defaultWispUrl = "";
const wispUrl = process.env.WISP_URL || defaultWispUrl;

const content = `window.__APP_CONFIG__ = Object.freeze({\n  wispUrl: ${JSON.stringify(wispUrl)}\n});\n`;

await writeFile(configFile, content, "utf8");
console.log(`Wrote public/config.js (WISP_URL ${wispUrl ? "set" : "not set"}).`);
