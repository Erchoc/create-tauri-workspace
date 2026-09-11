#!/usr/bin/env node

// Serves a locally built update so the whole flow can be exercised without
// publishing anything.
//
// It finds every bundle artifact that has a signature beside it, writes the
// manifest the updater expects, and serves both over HTTP. Point the
// application's endpoint at the printed URL, build a lower version, and run it.

import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { basename, dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(
  readFileSync(join(projectRoot, "crates", "app", "tauri.conf.json"), "utf8"),
);

function parseArguments(argv) {
  const options = {
    port: 8787,
    host: "127.0.0.1",
    targetDir: undefined,
    version: undefined,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];
    if (argument === "--port") {
      options.port = Number(value);
      index += 1;
    } else if (argument === "--host") {
      options.host = value;
      index += 1;
    } else if (argument === "--target-dir") {
      options.targetDir = resolve(value);
      index += 1;
    } else if (argument === "--version") {
      if (!value || !/^\d+\.\d+\.\d+$/.test(value)) {
        throw new Error("--version requires a value such as 1.2.3.");
      }
      options.version = value;
      index += 1;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  if (!Number.isInteger(options.port) || options.port <= 0) {
    throw new Error("--port requires a positive integer.");
  }
  return options;
}

/** The key the updater looks up in the manifest, such as `darwin-aarch64`. */
function platformKey() {
  const os = { darwin: "darwin", win32: "windows", linux: "linux" }[
    process.platform
  ];
  const arch = { x64: "x86_64", arm64: "aarch64", ia32: "i686", arm: "armv7" }[
    process.arch
  ];
  if (!os || !arch) {
    throw new Error(`Unsupported platform: ${process.platform}/${process.arch}`);
  }
  return `${os}-${arch}`;
}

function walk(directory, found = []) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      walk(path, found);
    } else {
      found.push(path);
    }
  }
  return found;
}

const options = parseArguments(process.argv.slice(2));
const targetDir =
  options.targetDir ??
  (process.env.CARGO_TARGET_DIR
    ? resolve(process.env.CARGO_TARGET_DIR)
    : join(projectRoot, "target"));
const bundleDir = join(targetDir, "release", "bundle");

if (!existsSync(bundleDir)) {
  console.error(`No bundles found at ${bundleDir}.`);
  console.error("Build first, with the signing key exported:");
  console.error("  TAURI_SIGNING_PRIVATE_KEY=... bun run build");
  process.exit(1);
}

// An update artifact is any file that the bundler signed, which is exactly the
// set that has a .sig beside it. That rule holds across platforms without this
// script having to know their bundle layouts.
const signatures = walk(bundleDir).filter((path) => path.endsWith(".sig"));
const artifacts = signatures
  .map((signature) => ({
    signature: readFileSync(signature, "utf8").trim(),
    file: signature.slice(0, -".sig".length),
  }))
  .filter((entry) => existsSync(entry.file));

if (artifacts.length === 0) {
  console.error(`No signed artifacts under ${bundleDir}.`);
  console.error("A build without TAURI_SIGNING_PRIVATE_KEY produces no .sig");
  console.error("files, and bundle.createUpdaterArtifacts must be true.");
  process.exit(1);
}

// A platform maps to exactly one entry in the manifest, so when a build
// produced several signed artifacts the right one has to be chosen rather
// than silently overwritten. This is the order tauri-action itself prefers.
const PREFERENCE = [".app.tar.gz", ".AppImage", "-setup.exe", ".nsis.zip", ".msi"];

function preferred(candidates) {
  for (const suffix of PREFERENCE) {
    const match = candidates.find((entry) => entry.file.endsWith(suffix));
    if (match) {
      return match;
    }
  }
  return candidates[0];
}

// The version comes from what was built, never from tauri.conf.json: this
// script is meant to run while the project has been rolled back to a lower
// version, and reading the config there would serve that lower version and
// silently offer no update at all.
//
// Most bundles carry the version in their file name. macOS `.app.tar.gz` does
// not, so a sibling artifact from the same build is consulted before giving up.
function versionOf(file) {
  return /[_-](\d+\.\d+\.\d+)[_.-]/.exec(basename(file))?.[1];
}

function resolveVersion(chosenFile, everyFile) {
  const found = versionOf(chosenFile) ?? everyFile.map(versionOf).find(Boolean);
  if (found) {
    return found;
  }
  console.error("Could not read a version from any built artifact.");
  console.error("Pass it explicitly, matching the build you are serving:");
  console.error("  bun run updater:serve --version 0.2.0");
  process.exit(1);
}

const origin = `http://${options.host}:${options.port}`;
const key = platformKey();
const chosen = preferred(artifacts);
const version =
  options.version ?? resolveVersion(chosen.file, walk(bundleDir));

if (artifacts.length > 1) {
  console.log("Several signed artifacts exist; serving the one the updater");
  console.log(`would pick: ${basename(chosen.file)}\n`);
}

const manifest = {
  version,
  notes: "Local test build.",
  pub_date: new Date().toISOString(),
  platforms: {
    [key]: {
      signature: chosen.signature,
      url: `${origin}/${encodeURIComponent(basename(chosen.file))}`,
    },
  },
};

const byName = new Map(
  artifacts.map((artifact) => [basename(artifact.file), artifact.file]),
);

const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, origin).pathname).slice(1);

  if (path === "latest.json" || path === "") {
    response.writeHead(200, {
      "content-type": "application/json",
      "cache-control": "no-store",
    });
    response.end(JSON.stringify(manifest, null, 2));
    return;
  }

  const file = byName.get(path);
  if (!file) {
    response.writeHead(404).end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": "application/octet-stream",
    "content-length": statSync(file).size,
  });
  createReadStream(file).pipe(response);
});

server.listen(options.port, options.host, () => {
  console.log(`\nServing version ${version} for ${key}\n`);
  if (version !== config.version) {
    console.log(
      `  (this project is currently at ${config.version}, so it will be offered this update)\n`,
    );
  }
  for (const artifact of artifacts) {
    const mark = artifact === chosen ? "→" : " ";
    console.log(`  ${mark} ${basename(artifact.file)}`);
  }
  console.log(`\n  manifest  ${origin}/latest.json\n`);
  console.log("To test against it, in a copy of this project:\n");
  console.log("  1. Set the endpoint in crates/app/tauri.conf.json:");
  console.log(`       "endpoints": ["${origin}/latest.json"]`);
  console.log("  2. Set a LOWER version in package.json and tauri.conf.json.");
  console.log("  3. Run `bun run dev`, or build and launch that lower version.");
  console.log("\nA debug build accepts this http endpoint with a warning. A");
  console.log("release build refuses it unless you also set");
  console.log('`"dangerousInsecureTransportProtocol": true` — which must never');
  console.log("reach a real release.\n");
  console.log("Press Ctrl+C to stop.");
});
