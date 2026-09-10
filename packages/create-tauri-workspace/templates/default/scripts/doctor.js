#!/usr/bin/env node

// Reports whether this machine can build the project, and how to fix it when
// it cannot.
//
// The required versions are not written here. They are read from the files
// that already declare them — `engines` in package.json and `rust-version` in
// Cargo.toml — so there is one place to change a floor.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  readFileSync(join(projectRoot, "package.json"), "utf8"),
);
const cargo = readFileSync(join(projectRoot, "Cargo.toml"), "utf8");

const colour = Boolean(process.stdout.isTTY && !process.env.NO_COLOR);
const paint = (value, code) =>
  colour ? `\u001B[${code}m${value}\u001B[0m` : value;
const green = (value) => paint(value, "32");
const red = (value) => paint(value, "31");
const yellow = (value) => paint(value, "33");
const cyan = (value) => paint(value, "36");
const dim = (value) => paint(value, "2");

function floor(range) {
  const match = /(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(range ?? "");
  return match ? `${match[1]}.${match[2] ?? 0}.${match[3] ?? 0}` : undefined;
}

const REQUIRED = {
  bun: floor(manifest.engines?.bun),
  node: floor(manifest.engines?.node),
  rust: floor(/rust-version\s*=\s*"([^"]+)"/.exec(cargo)?.[1]),
};

function parseVersion(value) {
  const match = /(\d+)\.(\d+)(?:\.(\d+))?/.exec(value ?? "");
  return match
    ? [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)]
    : undefined;
}

function isNewEnough(found, minimum) {
  const a = parseVersion(found);
  const b = parseVersion(minimum);
  if (!a || !b) {
    return false;
  }
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) {
      return a[index] > b[index];
    }
  }
  return true;
}

function capture(command, argv) {
  const result = spawnSync(command, argv, {
    encoding: "utf8",
    shell: process.platform === "win32",
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    return undefined;
  }
  return `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
}

function hint(options) {
  return options[process.platform] ?? options.default;
}

const CHECKS = [
  {
    label: "Bun",
    minimum: REQUIRED.bun,
    detect: () => capture("bun", ["--version"]),
    reason: "runs every project command.",
    missing: () =>
      hint({
        win32: 'powershell -c "irm bun.sh/install.ps1 | iex"',
        default: "curl -fsSL https://bun.sh/install | bash",
      }),
    outdated: () => "bun upgrade",
  },
  {
    label: "Node.js",
    minimum: REQUIRED.node,
    detect: () => capture("node", ["--version"]),
    reason: "runs the release and updater scripts.",
    missing: () => "Install from https://nodejs.org/ or a version manager.",
    outdated: () =>
      hint({
        darwin: "nvm install 24 && nvm use 24   (or brew upgrade node)",
        win32: "winget upgrade OpenJS.NodeJS",
        default: "nvm install 24 && nvm use 24",
      }),
  },
  {
    label: "Rust",
    minimum: REQUIRED.rust,
    detect: () => capture("rustc", ["--version"]),
    reason: "compiles the desktop application.",
    missing: () =>
      hint({
        win32: "Download rustup from https://rustup.rs/",
        default:
          "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh",
      }),
    outdated: () => "rustup update stable",
  },
];

function platformCheck() {
  if (process.platform === "linux") {
    return {
      label: "WebKitGTK",
      ok: capture("pkg-config", ["--exists", "webkit2gtk-4.1"]) !== undefined,
      found: "webkit2gtk-4.1",
      reason: "provides the webview the window renders into.",
      remedy: [
        "sudo apt-get install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf",
        "Other distributions: https://v2.tauri.app/start/prerequisites/",
      ],
    };
  }
  if (process.platform === "darwin") {
    return {
      label: "Xcode tools",
      ok: capture("xcode-select", ["-p"]) !== undefined,
      found: "installed",
      reason: "provides the linker and the macOS SDK.",
      remedy: ["xcode-select --install"],
    };
  }
  if (process.platform === "win32") {
    return {
      label: "MSVC tools",
      ok: capture("where", ["link"]) !== undefined,
      found: "installed",
      reason: "links the Windows executable.",
      remedy: [
        "Install the Visual Studio Build Tools with the C++ workload.",
        "https://v2.tauri.app/start/prerequisites/",
      ],
    };
  }
  return undefined;
}

const results = [];

for (const check of CHECKS) {
  const output = check.detect();
  const version = output ? parseVersion(output)?.join(".") : undefined;

  if (!version) {
    results.push({
      label: check.label,
      ok: false,
      detail: "not found",
      minimum: check.minimum,
      problem: `${check.label} is not installed.`,
      reason: check.reason,
      remedy: [check.missing()],
    });
  } else if (check.minimum && !isNewEnough(version, check.minimum)) {
    results.push({
      label: check.label,
      ok: false,
      detail: version,
      minimum: check.minimum,
      problem: `${check.label} ${version} is older than ${check.minimum}.`,
      reason: check.reason,
      remedy: [check.outdated()],
    });
  } else {
    results.push({
      label: check.label,
      ok: true,
      detail: version,
      minimum: check.minimum,
    });
  }
}

const platform = platformCheck();
if (platform) {
  results.push({
    label: platform.label,
    ok: platform.ok,
    detail: platform.ok ? platform.found : "not found",
    problem: platform.ok ? undefined : `${platform.label} is not installed.`,
    reason: platform.reason,
    remedy: platform.remedy,
  });
}

console.log(`\n${cyan("◆")} Environment check\n`);

for (const result of results) {
  const mark = result.ok ? green("  ✓") : red("  ✗");
  const bound = result.minimum ? dim(`needs ${result.minimum} or newer`) : "";
  console.log(
    `${mark} ${result.label.padEnd(14)}${result.detail.padEnd(18)}${bound}`,
  );
}

const problems = results.filter((result) => !result.ok);

if (problems.length === 0) {
  console.log(`\n${green("This machine is ready.")} Run bun run dev.\n`);
  process.exit(0);
}

console.log("");
for (const problem of problems) {
  console.log(`${red(problem.label)} — ${problem.problem}`);
  console.log(dim(`  It ${problem.reason}`));
  for (const line of problem.remedy) {
    console.log(`  ${cyan(line)}`);
  }
  console.log("");
}

console.log(
  `${yellow("Not ready.")} Fix the ${problems.length === 1 ? "problem" : `${problems.length} problems`} above, then run bun run doctor again.\n`,
);
process.exit(1);
