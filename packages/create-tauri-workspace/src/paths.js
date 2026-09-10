import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const packageRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const templateRoot = join(packageRoot, "templates", "default");
export const skillRoot = join(packageRoot, "skills");
export const manifest = JSON.parse(
  readFileSync(join(packageRoot, "package.json"), "utf8"),
);
