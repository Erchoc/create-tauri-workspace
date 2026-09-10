import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createInterface } from "node:readline/promises";
import { dirname, extname, join, resolve } from "node:path";
import process from "node:process";

import { PLACEHOLDER_REPOSITORY, updateEndpoint } from "./options.js";
import { templateRoot } from "./paths.js";
import { commandExists, run } from "./shell.js";
import { ansi, printStep, printWarning } from "./terminal.js";

// Files whose contents carry __PROJECT_*__ placeholders. Anything else is
// copied byte for byte, which keeps icons and other binaries intact.
const TEXT_EXTENSIONS = new Set([
  "",
  ".css",
  ".html",
  ".json",
  ".lock",
  ".md",
  ".mjs",
  ".js",
  ".nsh",
  ".ps1",
  ".rs",
  ".sh",
  ".svg",
  ".toml",
  ".ts",
  ".tsx",
  ".yml",
  ".yaml",
]);

export function normalizeProjectName(input) {
  const slug = input
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (!slug) {
    throw new Error("Project name must contain at least one letter or number.");
  }

  if (!/^[a-z]/.test(slug) || slug.length > 100) {
    throw new Error(
      "Project name must start with a letter and be at most 100 URL-safe characters.",
    );
  }

  return slug;
}

export function displayNameFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function walk(directory, visit) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      walk(path, visit);
    } else {
      visit(path);
    }
  }
}

function replaceTokens(destination, values) {
  walk(destination, (path) => {
    if (!TEXT_EXTENSIONS.has(extname(path))) {
      return;
    }
    let content = readFileSync(path, "utf8");
    for (const [token, value] of Object.entries(values)) {
      content = content.split(token).join(value);
    }
    writeFileSync(path, content);
  });
}

// npm refuses to publish a file named .gitignore, so the template ships it
// under a neutral name and it is restored here.
function restoreDotfiles(destination) {
  walk(destination, (path) => {
    if (path.endsWith("_gitignore")) {
      renameSync(path, join(dirname(path), ".gitignore"));
    }
  });
}

async function askForProjectName() {
  if (!process.stdin.isTTY) {
    throw new Error("A project name is required in non-interactive mode.");
  }
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    return await prompt.question("Project name: ");
  } finally {
    prompt.close();
  }
}

function reportNextSteps({ destination, identifier, installed, repository }) {
  console.log(`\n${ansi.green("Done.")}`);
  console.log("\nNext steps:\n");
  console.log(`  cd ${JSON.stringify(destination)}`);
  if (!installed) {
    console.log("  bun install");
  }
  console.log("  bun run dev");

  const remaining = [];
  if (identifier.startsWith("com.example.")) {
    remaining.push("set a bundle identifier you own in crates/app/tauri.conf.json");
  }
  if (!repository) {
    remaining.push("point plugins.updater.endpoints at your GitHub repository");
  }
  remaining.push(`run ${ansi.cyan("bun run updater:init")} to enable updates`);

  console.log("\nBefore the first release:\n");
  for (const item of remaining) {
    console.log(`  - ${item}`);
  }
  console.log(`\n${ansi.dim("bun run release:check verifies all of the above.")}`);
}

export async function createWorkspace(options) {
  const rawName = options.projectName ?? (await askForProjectName());
  const slug = normalizeProjectName(rawName);
  const displayName = displayNameFromSlug(slug);
  const destination = resolve(options.output, slug);
  const identifier = options.identifier ?? `com.example.${slug}`;

  if (existsSync(destination)) {
    throw new Error(`Destination already exists: ${destination}`);
  }

  mkdirSync(options.output, { recursive: true });
  console.log(`\n${ansi.cyan("◆")} Creating ${ansi.bold(displayName)}\n`);
  cpSync(templateRoot, destination, { recursive: true });
  restoreDotfiles(destination);

  replaceTokens(destination, {
    __PROJECT_DISPLAY_NAME__: displayName,
    __PROJECT_IDENTIFIER__: identifier,
    __PROJECT_REPOSITORY__: options.repository ?? PLACEHOLDER_REPOSITORY,
    __PROJECT_RUST_LIB__: `${slug.replaceAll("-", "_")}_lib`,
    __PROJECT_SLUG__: slug,
    __PROJECT_UPDATER_PUBKEY__: "",
    __PROJECT_UPDATE_ENDPOINT__: updateEndpoint(options.repository),
  });
  printStep("Template copied", destination);

  let installed = false;
  if (options.install && commandExists("bun")) {
    console.log("\nInstalling dependencies with Bun...\n");
    run("bun", ["install"], destination);
    installed = true;
    printStep("Dependencies installed", "Bun");
  } else if (options.install) {
    printWarning("Bun was not found; dependency installation was skipped.");
  }

  if (options.git && commandExists("git")) {
    run("git", ["init", "-b", "main"], destination);
    printStep("Git initialized", "main");
  } else if (options.git) {
    printWarning("Git was not found; repository initialization was skipped.");
  }

  reportNextSteps({
    destination,
    identifier,
    installed,
    repository: options.repository,
  });

  return destination;
}
