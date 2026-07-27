#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageDirectory = "packages/create-tauri-workspace";
const manifest = JSON.parse(
  readFileSync(resolve(repositoryRoot, packageDirectory, "package.json"), "utf8"),
);
const packageSpec = `${manifest.name}@${manifest.version}`;
const dryRun = process.argv.slice(2).includes("--dry-run");
const unknownArguments = process.argv
  .slice(2)
  .filter((argument) => argument !== "--dry-run");
const colorEnabled = Boolean(process.stdout.isTTY && !process.env.NO_COLOR);

function style(value, code) {
  return colorEnabled ? `\u001B[${code}m${value}\u001B[0m` : value;
}

const text = {
  bold: (value) => style(value, "1"),
  dim: (value) => style(value, "2"),
  cyan: (value) => style(value, "36"),
  green: (value) => style(value, "32"),
  red: (value) => style(value, "31"),
  yellow: (value) => style(value, "33"),
};

function execute(command, arguments_, options = {}) {
  const result = spawnSync(command, arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.error) {
    throw new Error(`Could not run ${command}: ${result.error.message}`);
  }

  if (!options.allowFailure && result.status !== 0) {
    const detail = options.capture ? result.stderr.trim() : "";
    throw new Error(
      `${command} ${arguments_.join(" ")} failed.${detail ? `\n${detail}` : ""}`,
    );
  }

  return result;
}

function capture(command, arguments_) {
  return execute(command, arguments_, { capture: true }).stdout.trim();
}

function pass(label, detail = "") {
  const suffix = detail ? text.dim(`  ${detail}`) : "";
  console.log(`${text.green("  ✓")} ${label}${suffix}`);
}

function fail(message) {
  throw new Error(message);
}

function ensureInteractiveTerminal() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    fail("Publishing requires an interactive terminal.");
  }
}

function ensureCleanWorkingTree() {
  if (capture("git", ["status", "--porcelain"])) {
    fail("The Git working tree is not clean. Commit or stash changes first.");
  }
  pass("Git working tree is clean");
}

function ensureMainIsPublished() {
  const branch = capture("git", ["branch", "--show-current"]);
  if (branch !== "main") {
    fail(`Expected the main branch, but found ${branch || "detached HEAD"}.`);
  }

  execute("git", ["fetch", "--quiet", "origin", "main"]);
  const localRevision = capture("git", ["rev-parse", "HEAD"]);
  const remoteRevision = capture("git", ["rev-parse", "origin/main"]);
  if (localRevision !== remoteRevision) {
    fail("Local main does not match origin/main. Push or pull before publishing.");
  }
  pass("Git main matches origin/main", localRevision.slice(0, 7));
}

function runProjectChecks() {
  console.log(`\n${text.cyan("◆")} Running project checks\n`);
  execute("bun", ["run", "check"]);
  pass("Tests and package checks passed");
}

function getNpmIdentity() {
  const identity = capture("npm", ["whoami"]);
  pass("npm authentication is active", identity);
  return identity;
}

function ensureTwoFactorAuthentication() {
  const rawProfile = capture("npm", ["profile", "get", "--json"]);
  const profile = JSON.parse(rawProfile);
  const twoFactor = profile.tfa;
  const enabled = Boolean(
    twoFactor &&
      typeof twoFactor === "object" &&
      !twoFactor.pending &&
      twoFactor.mode,
  );

  if (!enabled) {
    fail(
      "npm account 2FA is disabled. Enable it under npm Account Settings before publishing.",
    );
  }
  pass("npm account 2FA is enabled", twoFactor.mode);
}

function ensureVersionIsAvailable() {
  const result = execute(
    "npm",
    ["view", packageSpec, "version", "--json"],
    { capture: true, allowFailure: true },
  );

  if (result.status === 0) {
    fail(
      `${packageSpec} is already published. Bump the workspace package version, commit, and push before retrying.`,
    );
  }

  const output = `${result.stdout}\n${result.stderr}`;
  if (!output.includes("E404")) {
    fail(`Could not verify ${packageSpec} on the npm registry.\n${result.stderr.trim()}`);
  }
  pass("Package version is available", packageSpec);
}

async function confirmPublish() {
  const mode = dryRun ? "dry-run" : "publish";
  const prompt = [
    "",
    `${text.yellow("Ready to publish:")} ${text.bold(packageSpec)}`,
    `Mode: ${mode}`,
    "",
    "Press Enter to confirm, or type anything to cancel: ",
  ].join("\n");
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await terminal.question(prompt);
  terminal.close();
  return answer.length === 0;
}

function publishPackage() {
  const arguments_ = [
    "publish",
    "--workspace",
    packageDirectory,
    "--access",
    "public",
  ];
  if (dryRun) {
    arguments_.push("--dry-run");
  }

  execute("npm", arguments_);
}

async function verifyPublishedVersion() {
  if (dryRun) {
    pass("npm publish dry-run passed");
    return;
  }

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const result = execute(
      "npm",
      ["view", packageSpec, "version", "--json"],
      { capture: true, allowFailure: true },
    );
    const publishedVersion = result.stdout.trim().replaceAll('"', "");
    if (result.status === 0 && publishedVersion === manifest.version) {
      pass("Registry verification passed", packageSpec);
      return;
    }
    if (attempt < 5) {
      await new Promise((resolve_) => setTimeout(resolve_, 1_000));
    }
  }
  fail(`npm accepted the publish, but ${packageSpec} is not visible yet.`);
}

async function main() {
  if (unknownArguments.length) {
    fail(`Unknown argument: ${unknownArguments[0]}`);
  }
  ensureInteractiveTerminal();

  console.log(
    `\n${text.cyan("◆")} Pre-publish checks for ${text.bold(packageSpec)}\n`,
  );
  ensureCleanWorkingTree();
  ensureMainIsPublished();
  runProjectChecks();
  ensureCleanWorkingTree();
  getNpmIdentity();
  ensureTwoFactorAuthentication();
  ensureVersionIsAvailable();

  if (!(await confirmPublish())) {
    console.log(`\n${text.yellow("Cancelled.")} Nothing was published.`);
    return;
  }

  console.log(`\n${text.cyan("◆")} Publishing ${text.bold(packageSpec)}\n`);
  publishPackage();
  await verifyPublishedVersion();
  console.log(`\n${text.green("Done.")} ${packageSpec} is ready.`);
}

main().catch((error) => {
  console.error(`\n${text.red("Publish stopped:")} ${error.message}`);
  process.exitCode = 1;
});
