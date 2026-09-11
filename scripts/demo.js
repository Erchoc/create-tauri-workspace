#!/usr/bin/env node

// Regenerates a scratch project under work/ from the current source.
//
// The generator refuses to overwrite an existing destination, which is right
// when someone is creating a real project and wrong for a throwaway you
// rebuild after every change. This removes the previous one first.

import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(
  repositoryRoot,
  "packages",
  "create-tauri-workspace",
  "bin",
  "create-tauri-workspace.js",
);

const [name = "demo-app", ...extra] = process.argv.slice(2);
if (name.startsWith("-")) {
  console.error("Usage: bun run demo [name] [-- extra CLI options]");
  process.exit(1);
}

const workspace = join(repositoryRoot, "work");
const destination = join(workspace, name);

if (existsSync(destination)) {
  console.log(`Replacing the previous ${join("work", name)}\n`);
  rmSync(destination, { recursive: true, force: true });
}

const result = spawnSync(
  process.execPath,
  [
    cli,
    name,
    "--output",
    workspace,
    "--identifier",
    `dev.example.${name.replaceAll("-", "")}`,
    "--repo",
    `example/${name}`,
    "--no-git",
    ...extra,
  ],
  { stdio: "inherit" },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`\nRun it with:\n\n  cd ${join("work", name)}\n  bun run dev\n`);
