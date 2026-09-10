#!/usr/bin/env node

// Prepares signed automatic updates:
//   1. generates a minisign key pair with the Tauri CLI,
//   2. writes the public key into crates/app/tauri.conf.json,
//   3. turns on updater artifacts for release builds.
//
// The private key is never printed. It stays in the file this script reports
// so it can be uploaded straight to a secret store.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = join(projectRoot, "crates", "app", "tauri.conf.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));

function parseArguments(argv) {
  const options = {
    force: false,
    key: undefined,
    password: process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD,
    passwordless: false,
    repository: undefined,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--force") {
      options.force = true;
    } else if (argument === "--no-password") {
      options.passwordless = true;
    } else if (argument === "--password") {
      const value = argv[index + 1];
      if (value === undefined) {
        throw new Error("--password requires a value.");
      }
      options.password = value;
      index += 1;
    } else if (argument === "--key" || argument === "--repo") {
      const value = argv[index + 1];
      if (!value || value.startsWith("-")) {
        throw new Error(`${argument} requires a value.`);
      }
      if (argument === "--key") {
        options.key = resolve(value);
      } else {
        if (!/^[\w.-]+\/[\w.-]+$/.test(value)) {
          throw new Error("--repo must look like owner/name.");
        }
        options.repository = value;
      }
      index += 1;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  return options;
}

function generateKeyPair(keyPath, options) {
  mkdirSync(dirname(keyPath), { recursive: true });
  const argv = ["run", "--cwd", "crates/app", "tauri", "signer", "generate"];
  if (options.force) {
    argv.push("--force");
  }
  argv.push("-w", keyPath);

  if (options.password !== undefined) {
    // --ci stops the Tauri CLI from prompting for a value it already has.
    argv.push("--ci", "--password", options.password);
  } else if (options.passwordless) {
    argv.push("--ci");
    console.log("Generating an unencrypted key. Anyone who reads the file can");
    console.log("sign updates for this application, so restrict access to it.\n");
  } else if (process.stdin.isTTY) {
    console.log("Generating an update signing key. Choose a password you can");
    console.log("store alongside the key itself.\n");
  } else {
    throw new Error(
      "The Tauri CLI needs a terminal to prompt for a password. Pass " +
        "--password <value>, set TAURI_SIGNING_PRIVATE_KEY_PASSWORD, or pass " +
        "--no-password to generate an unencrypted key.",
    );
  }

  const result = spawnSync("bun", argv, {
    cwd: projectRoot,
    shell: process.platform === "win32",
    stdio: "inherit",
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error("The Tauri CLI could not generate a key pair.");
  }
}

const options = parseArguments(process.argv.slice(2));
const slug = JSON.parse(
  readFileSync(join(projectRoot, "package.json"), "utf8"),
).name;
const keyPath = options.key ?? join(homedir(), ".tauri", `${slug}-updater.key`);
const publicKeyPath = `${keyPath}.pub`;

if (!relative(projectRoot, keyPath).startsWith("..")) {
  console.error("Refusing to write a private key inside the repository.");
  console.error(`Pass --key with a path outside ${projectRoot}.`);
  process.exit(1);
}

if (existsSync(keyPath) && !options.force) {
  console.log(`Reusing the existing key at ${keyPath}.`);
  console.log("Pass --force to replace it. Replacing a key stops every");
  console.log("already-installed copy of the app from accepting updates.\n");
} else {
  generateKeyPair(keyPath, options);
}

if (!existsSync(publicKeyPath)) {
  console.error(`Expected a public key at ${publicKeyPath}.`);
  process.exit(1);
}

const publicKey = readFileSync(publicKeyPath, "utf8").trim();
config.plugins ??= {};
config.plugins.updater ??= {};
config.plugins.updater.pubkey = publicKey;
config.bundle ??= {};
config.bundle.createUpdaterArtifacts = true;

if (options.repository) {
  config.plugins.updater.endpoints = [
    `https://github.com/${options.repository}/releases/latest/download/latest.json`,
  ];
}

writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

const [endpoint] = config.plugins.updater.endpoints ?? [];
console.log("Updates are configured.\n");
console.log(`  public key   written to crates/app/tauri.conf.json`);
console.log(`  private key  ${keyPath}`);
console.log(`  endpoint     ${endpoint ?? "not set"}\n`);
console.log("Add the private key to your release secrets:\n");
console.log(`  gh secret set TAURI_SIGNING_PRIVATE_KEY < ${JSON.stringify(keyPath)}`);
if (!options.passwordless) {
  console.log("  gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD");
}
console.log("");
console.log("Back up the private key. Losing it means installed copies of the");
console.log("application can never be updated again.");
