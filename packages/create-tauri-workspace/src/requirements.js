import { spawnSync } from "node:child_process";
import process from "node:process";

import { parseVersion, satisfies } from "./versions.js";

// The single source of truth for what a machine needs before it can build a
// generated project. The template repeats these floors in its own manifests
// (package.json engines and Cargo.toml rust-version) because a generated
// project must stand alone; a test keeps the two in step.
export const TOOLCHAIN = {
  bun: "1.4.0",
  node: "24.0.0",
  rust: "1.98.0",
};

function run(command, argv) {
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

function upgradeHint(hints) {
  return hints[process.platform] ?? hints.default;
}

const TOOLS = [
  {
    id: "bun",
    label: "Bun",
    minimum: TOOLCHAIN.bun,
    reason: "runs every project command and installs frontend dependencies.",
    detect: () => run("bun", ["--version"]),
    install: () =>
      upgradeHint({
        win32: 'powershell -c "irm bun.sh/install.ps1 | iex"',
        default: "curl -fsSL https://bun.sh/install | bash",
      }),
    upgrade: () => "bun upgrade",
  },
  {
    id: "node",
    label: "Node.js",
    minimum: TOOLCHAIN.node,
    reason: "runs the project scripts, including the updater setup.",
    detect: () => run("node", ["--version"]),
    install: () =>
      upgradeHint({
        darwin: "brew install node   (or download from https://nodejs.org/)",
        win32: "winget install OpenJS.NodeJS   (or https://nodejs.org/)",
        default: "Download from https://nodejs.org/ or use a version manager.",
      }),
    upgrade: () =>
      upgradeHint({
        darwin: "nvm install 24 && nvm use 24   (or brew upgrade node)",
        win32: "winget upgrade OpenJS.NodeJS   (or nvm-windows)",
        default: "nvm install 24 && nvm use 24",
      }),
  },
  {
    id: "rust",
    label: "Rust",
    minimum: TOOLCHAIN.rust,
    reason: "compiles the desktop application itself.",
    detect: () => run("rustc", ["--version"]),
    install: () =>
      upgradeHint({
        win32: "Download rustup from https://rustup.rs/",
        default: "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh",
      }),
    upgrade: () => "rustup update stable",
  },
];

const OPTIONAL_TOOLS = [
  {
    id: "git",
    label: "Git",
    reason: "initializes the repository and is needed to publish releases.",
    detect: () => run("git", ["--version"]),
    install: () =>
      upgradeHint({
        darwin: "xcode-select --install",
        win32: "winget install Git.Git",
        default: "Install git with your package manager.",
      }),
  },
];

/**
 * Tauri needs a platform webview and toolchain that the language toolchains
 * above do not cover. These are checked separately because the remedy is an
 * operating system package, not a version bump.
 */
function platformPrerequisite() {
  if (process.platform === "linux") {
    const found = run("pkg-config", ["--exists", "webkit2gtk-4.1"]) !== undefined;
    return {
      id: "webkit2gtk",
      label: "WebKitGTK",
      optional: false,
      ok: found,
      found: found ? "webkit2gtk-4.1" : undefined,
      reason: "provides the webview the desktop window renders into.",
      remedy: [
        "sudo apt-get install libwebkit2gtk-4.1-dev libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev patchelf",
        "See https://v2.tauri.app/start/prerequisites/ for other distributions.",
      ],
    };
  }

  if (process.platform === "darwin") {
    const found = run("xcode-select", ["-p"]) !== undefined;
    return {
      id: "xcode",
      label: "Xcode tools",
      optional: false,
      ok: found,
      found: found ? "installed" : undefined,
      reason: "provides the linker and macOS SDK.",
      remedy: ["xcode-select --install"],
    };
  }

  if (process.platform === "win32") {
    const found = run("where", ["link"]) !== undefined;
    return {
      id: "msvc",
      label: "MSVC build tools",
      optional: true,
      ok: found,
      found: found ? "installed" : undefined,
      reason: "links the Windows executable. WebView2 ships with Windows 11.",
      remedy: [
        "Install the Visual Studio Build Tools with the C++ workload.",
        "See https://v2.tauri.app/start/prerequisites/",
      ],
    };
  }

  return undefined;
}

function checkTool(tool, { optional = false } = {}) {
  const output = tool.detect();
  const base = {
    id: tool.id,
    label: tool.label,
    minimum: tool.minimum,
    reason: tool.reason,
    optional,
  };

  if (output === undefined) {
    return {
      ...base,
      ok: optional,
      found: undefined,
      problem: `${tool.label} was not found on this machine.`,
      remedy: [tool.install()],
    };
  }

  // Each tool reports its version differently ("1.4.2", "v24.1.0",
  // "rustc 1.98.1 (48a229cea 2026-09-01)"), so read the numbers rather than
  // a fixed field position.
  const parsed = parseVersion(output);
  const found = parsed ? parsed.join(".") : output;

  if (parsed === undefined) {
    return {
      ...base,
      ok: optional,
      found: undefined,
      problem: `Could not read a version from ${tool.label}.`,
      remedy: [tool.install()],
    };
  }

  if (tool.minimum && !satisfies(output, tool.minimum)) {
    return {
      ...base,
      ok: false,
      found,
      problem: `${tool.label} ${found} is older than ${tool.minimum}.`,
      remedy: [tool.upgrade()],
    };
  }

  return { ...base, ok: true, found };
}

export function inspectEnvironment() {
  const checks = TOOLS.map((tool) => checkTool(tool));
  const platform = platformPrerequisite();
  if (platform) {
    checks.push({
      ...platform,
      problem: platform.ok
        ? undefined
        : `${platform.label} was not found on this machine.`,
    });
  }
  checks.push(...OPTIONAL_TOOLS.map((tool) => checkTool(tool, { optional: true })));
  return checks;
}
