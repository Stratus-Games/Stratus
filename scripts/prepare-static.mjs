import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const copies = [
  {
    from: resolve(root, "node_modules", "@mercuryworkshop", "scramjet", "dist"),
    to: resolve(root, "public", "scram")
  },
  {
    from: resolve(root, "node_modules", "@mercuryworkshop", "bare-mux", "dist"),
    to: resolve(root, "public", "baremux")
  },
  {
    from: resolve(root, "node_modules", "@mercuryworkshop", "libcurl-transport", "dist"),
    to: resolve(root, "public", "libcurl")
  },
  {
    from: resolve(root, "node_modules", "@mercuryworkshop", "bare-transport", "dist"),
    to: resolve(root, "public", "bare-transport")
  }
];

for (const entry of copies) {
  await mkdir(entry.to, { recursive: true });
  await cp(entry.from, entry.to, { recursive: true, force: true });
}

console.log("Prepared static assets in public/ for deployment.");
