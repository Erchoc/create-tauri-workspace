#!/usr/bin/env node

// Guards the published tarball.
//
// The template is a real, runnable project, so building or installing it
// inside this repository leaves behind directories that must never reach npm.
// A dry run alone does not catch that; this asserts on the file list.

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspace = "packages/create-tauri-workspace";

const forbidden = [
  /(^|\/)target\//,
  /(^|\/)node_modules\//,
  /(^|\/)dist\//,
  /(^|\/)release\//,
  /(^|\/)Cargo\.lock$/,
  /\.(key|p12|pfx)$/,
];

const required = [
  "bin/create-tauri-workspace.js",
  "src/index.js",
  "src/requirements.js",
  "skills/desktop-app/SKILL.md",
  "templates/default/package.json",
  "templates/default/bun.lock",
  "templates/default/_gitignore",
  "templates/default/crates/app/tauri.conf.json",
  "templates/default/scripts/updater-init.js",
  "templates/default/scripts/updater-serve.js",
  "templates/default/scripts/doctor.js",
];

const maximumFiles = 150;
const maximumBytes = 2_000_000;

const result = spawnSync(
  "npm",
  ["pack", "--workspace", workspace, "--dry-run", "--json"],
  { cwd: repositoryRoot, encoding: "utf8" },
);

if (result.status !== 0) {
  console.error(result.stderr || "npm pack failed.");
  process.exit(1);
}

const [report] = JSON.parse(result.stdout);
const paths = report.files.map((file) => file.path);
const problems = [];

for (const path of paths) {
  const pattern = forbidden.find((candidate) => candidate.test(path));
  if (pattern) {
    problems.push(`must not be published: ${path}`);
  }
}

for (const path of required) {
  if (!paths.includes(path)) {
    problems.push(`missing from the package: ${path}`);
  }
}

if (paths.length > maximumFiles) {
  problems.push(`${paths.length} files exceeds the ${maximumFiles} file limit`);
}

if (report.unpackedSize > maximumBytes) {
  problems.push(
    `unpacked size ${report.unpackedSize} exceeds ${maximumBytes} bytes`,
  );
}

if (!paths.some((path) => path.startsWith("templates/"))) {
  problems.push("the template directory is missing from the package");
}

if (problems.length > 0) {
  console.error("Package verification failed:");
  for (const problem of new Set(problems)) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

console.log(
  `Package looks publishable: ${paths.length} files, ${report.unpackedSize} bytes unpacked.`,
);
