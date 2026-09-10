#!/usr/bin/env node

// Catches the placeholder values that make a release fail late, after a full
// cross-platform build has already run.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(
  readFileSync(join(projectRoot, "crates", "app", "tauri.conf.json"), "utf8"),
);
const manifest = JSON.parse(
  readFileSync(join(projectRoot, "package.json"), "utf8"),
);

const problems = [];
const notes = [];

if (config.identifier.startsWith("com.example.")) {
  problems.push(
    "replace the placeholder identifier in crates/app/tauri.conf.json",
  );
}

if (!config.productName || config.productName.length === 0) {
  problems.push("set a product name in crates/app/tauri.conf.json");
}

if (config.version !== manifest.version) {
  problems.push(
    `align versions: package.json is ${manifest.version}, tauri.conf.json is ${config.version}`,
  );
}

for (const icon of config.bundle?.icon ?? []) {
  if (!existsSync(resolve(projectRoot, "crates", "app", icon))) {
    problems.push(`missing bundle icon: ${icon}`);
  }
}

const updater = config.plugins?.updater ?? {};
const publicKey = (updater.pubkey ?? "").trim();
const endpoints = updater.endpoints ?? [];
const placeholderEndpoint = endpoints.some((endpoint) =>
  endpoint.includes("OWNER/REPOSITORY"),
);
const artifactsEnabled = config.bundle?.createUpdaterArtifacts === true;

if (artifactsEnabled) {
  if (publicKey.length === 0) {
    problems.push(
      "updater artifacts are enabled but no public key is set; run bun run updater:init",
    );
  }
  if (endpoints.length === 0 || placeholderEndpoint) {
    problems.push(
      "point plugins.updater.endpoints at a repository you control",
    );
  }
} else if (publicKey.length > 0) {
  problems.push(
    "a public key is set but bundle.createUpdaterArtifacts is false; releases would ship without an update manifest",
  );
} else {
  notes.push(
    "automatic updates are off; run bun run updater:init to enable them",
  );
}

if (problems.length > 0) {
  console.error("Release check failed:");
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exitCode = 1;
} else {
  console.log("Release metadata looks ready.");
  for (const note of notes) {
    console.log(`- ${note}`);
  }
}
