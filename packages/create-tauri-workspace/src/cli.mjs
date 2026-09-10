import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import process from "node:process";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const templateRoot = join(packageRoot, "templates", "default");
const skillRoot = join(packageRoot, "skills");
const packageJson = JSON.parse(
  readFileSync(join(packageRoot, "package.json"), "utf8"),
);
const colorEnabled = Boolean(process.stdout.isTTY && !process.env.NO_COLOR);
const PLACEHOLDER_REPOSITORY = "OWNER/REPOSITORY";

const ansi = {
  bold: (value) => style(value, "1"),
  dim: (value) => style(value, "2"),
  cyan: (value) => style(value, "36"),
  green: (value) => style(value, "32"),
  yellow: (value) => style(value, "33"),
};

const textExtensions = new Set([
  "",
  ".css",
  ".html",
  ".json",
  ".lock",
  ".md",
  ".mjs",
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

function style(value, code) {
  return colorEnabled
    ? "\u001B[" + code + "m" + value + "\u001B[0m"
    : value;
}

function printStep(label, detail) {
  console.log(ansi.green("  ✓") + " " + label + ansi.dim("  " + detail));
}

function printWarning(message) {
  console.log(ansi.yellow("  !") + " " + message);
}

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

export const SKILL_NAME = "desktop-app";

// Claude Code and Codex read the same SKILL.md format from different
// directories, so one copy serves both.
export const SKILL_TARGETS = {
  claude: { label: "Claude Code", directory: join(".claude", "skills") },
  codex: { label: "Codex", directory: join(".agents", "skills") },
};

export function parseSkillArguments(argv) {
  const options = {
    action: undefined,
    global: false,
    output: process.cwd(),
    targets: [],
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--global" || argument === "-g") {
      options.global = true;
    } else if (argument === "--claude" || argument === "--codex") {
      options.targets.push(argument.slice(2));
    } else if (argument === "--output") {
      const output = argv[index + 1];
      if (!output || output.startsWith("-")) {
        throw new Error("--output requires a directory.");
      }
      options.output = resolve(output);
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else if (argument.startsWith("-")) {
      throw new Error("Unknown option: " + argument);
    } else if (options.action) {
      throw new Error("Only one skill action may be provided.");
    } else {
      options.action = argument;
    }
  }

  if (options.targets.length === 0) {
    options.targets = Object.keys(SKILL_TARGETS);
  }

  return options;
}

function printSkillHelp() {
  console.log(
    [
      ansi.bold("create-tauri-workspace skill") +
        " " +
        ansi.dim("v" + packageJson.version),
      "Install the desktop-app skill for Claude Code and Codex.",
      "",
      "Usage:",
      "  " + ansi.cyan("create-tauri-workspace skill install") + " [options]",
      "",
      "Options:",
      "  -g, --global          Install for every project instead of this one",
      "  --claude              Install only for Claude Code",
      "  --codex               Install only for Codex",
      "  --output <directory>  Project directory (default: current directory)",
      "  -h, --help            Show this help",
      "",
      "Without --claude or --codex the skill is installed for both.",
    ].join("\n"),
  );
}

export function installSkill(options) {
  if (!existsSync(join(skillRoot, SKILL_NAME))) {
    throw new Error("This package does not contain a skill to install.");
  }

  const base = options.global ? homedir() : options.output;
  const installed = [];

  for (const target of options.targets) {
    const definition = SKILL_TARGETS[target];
    if (!definition) {
      throw new Error("Unknown skill target: " + target);
    }
    const destination = join(base, definition.directory, SKILL_NAME);
    mkdirSync(dirname(destination), { recursive: true });
    rmSync(destination, { force: true, recursive: true });
    cpSync(join(skillRoot, SKILL_NAME), destination, { recursive: true });
    printStep(definition.label, destination);
    installed.push(destination);
  }

  console.log(
    "\n" +
      ansi.green("Done.") +
      " Ask for a desktop app and the skill will be used.",
  );

  return installed;
}

export function assertIdentifier(identifier) {
  if (!/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(identifier)) {
    throw new Error(
      "Identifier must be a reverse domain name such as com.example.app.",
    );
  }
  return identifier;
}

export function assertRepository(repository) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    throw new Error("Repository must look like owner/name.");
  }
  return repository;
}

export function updateEndpoint(repository) {
  const target = repository ?? PLACEHOLDER_REPOSITORY;
  return `https://github.com/${target}/releases/latest/download/latest.json`;
}

export function parseArguments(argv) {
  const options = {
    projectName: undefined,
    output: process.cwd(),
    identifier: undefined,
    repository: undefined,
    install: true,
    git: true,
    help: false,
    version: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--no-install") {
      options.install = false;
    } else if (argument === "--no-git") {
      options.git = false;
    } else if (argument === "--output") {
      const output = argv[index + 1];
      if (!output || output.startsWith("-")) {
        throw new Error("--output requires a directory.");
      }
      options.output = resolve(output);
      index += 1;
    } else if (argument === "--identifier") {
      const identifier = argv[index + 1];
      if (!identifier || identifier.startsWith("-")) {
        throw new Error("--identifier requires a reverse domain name.");
      }
      options.identifier = assertIdentifier(identifier);
      index += 1;
    } else if (argument === "--repo") {
      const repository = argv[index + 1];
      if (!repository || repository.startsWith("-")) {
        throw new Error("--repo requires an owner/name value.");
      }
      options.repository = assertRepository(repository);
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else if (argument === "--version" || argument === "-v") {
      options.version = true;
    } else if (argument.startsWith("-")) {
      throw new Error("Unknown option: " + argument);
    } else if (options.projectName) {
      throw new Error("Only one project name may be provided.");
    } else {
      options.projectName = argument;
    }
  }

  return options;
}

function printHelp() {
  console.log(
    [
      ansi.bold("create-tauri-workspace") +
        " " +
        ansi.dim("v" + packageJson.version),
      "Create an opinionated Tauri 2 desktop workspace.",
      "",
      "Usage:",
      "  " + ansi.cyan("create-tauri-workspace") + " [project-name] [options]",
      "  " +
        ansi.cyan("create-tauri-workspace skill install") +
        " [options]",
      "",
      "Options:",
      "  --output <directory>  Parent directory for the project",
      "  --identifier <id>     Bundle identifier, such as com.example.app",
      "  --repo <owner/name>   GitHub repository used for update downloads",
      "  --no-install          Skip bun install",
      "  --no-git              Skip git init",
      "  -h, --help            Show this help",
      "  -v, --version         Show the CLI version",
      "",
      "Examples:",
      "  npx create-tauri-workspace my-app",
      "  bunx create-tauri-workspace my-app --no-git",
      "  npx create-tauri-workspace my-app --identifier dev.acme.notes \\",
      "    --repo acme/notes",
    ].join("\n"),
  );
}

function commandExists(command) {
  const result =
    process.platform === "win32"
      ? spawnSync("where", [command], { stdio: "ignore" })
      : spawnSync("sh", ["-c", "command -v " + command], {
          stdio: "ignore",
        });
  return result.status === 0;
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    shell: process.platform === "win32",
    stdio: "inherit",
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(command + " exited with status " + result.status + ".");
  }
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
    const extension = extname(path);
    if (!textExtensions.has(extension)) {
      return;
    }
    let content = readFileSync(path, "utf8");
    for (const [token, value] of Object.entries(values)) {
      content = content.split(token).join(value);
    }
    writeFileSync(path, content);
  });
}

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

export async function createWorkspace(options) {
  const rawName = options.projectName ?? (await askForProjectName());
  const slug = normalizeProjectName(rawName);
  const displayName = displayNameFromSlug(slug);
  const destination = resolve(options.output, slug);

  if (existsSync(destination)) {
    throw new Error("Destination already exists: " + destination);
  }

  mkdirSync(options.output, { recursive: true });
  console.log(
    "\n" + ansi.cyan("◆") + " Creating " + ansi.bold(displayName) + "\n",
  );
  cpSync(templateRoot, destination, { recursive: true });
  restoreDotfiles(destination);

  const identifier = options.identifier ?? "com.example." + slug;
  replaceTokens(destination, {
    "__PROJECT_DISPLAY_NAME__": displayName,
    "__PROJECT_IDENTIFIER__": identifier,
    "__PROJECT_REPOSITORY__": options.repository ?? PLACEHOLDER_REPOSITORY,
    "__PROJECT_RUST_LIB__": slug.replaceAll("-", "_") + "_lib",
    "__PROJECT_SLUG__": slug,
    "__PROJECT_UPDATER_PUBKEY__": "",
    "__PROJECT_UPDATE_ENDPOINT__": updateEndpoint(options.repository),
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

  console.log("\n" + ansi.green("Done.") + " " + displayName + " is ready.");
  console.log("\nNext steps:\n");
  console.log("  cd " + JSON.stringify(destination));
  if (!installed) {
    console.log("  bun install");
  }
  console.log("  bun run dev");

  const remaining = [];
  if (identifier.startsWith("com.example.")) {
    remaining.push(
      "set a bundle identifier you own in crates/app/tauri.conf.json",
    );
  }
  if (!options.repository) {
    remaining.push(
      "point plugins.updater.endpoints at your GitHub repository",
    );
  }
  remaining.push("run " + ansi.cyan("bun run updater:init") + " to enable updates");

  console.log("\nBefore the first release:\n");
  for (const item of remaining) {
    console.log("  - " + item);
  }
  console.log(
    "\n" + ansi.dim("bun run release:check verifies all of the above."),
  );

  return destination;
}

export async function main(argv = process.argv.slice(2)) {
  if (argv[0] === "skill") {
    const skillOptions = parseSkillArguments(argv.slice(1));
    if (skillOptions.help || skillOptions.action === undefined) {
      printSkillHelp();
      return;
    }
    if (skillOptions.action !== "install") {
      throw new Error("Unknown skill action: " + skillOptions.action);
    }
    installSkill(skillOptions);
    return;
  }

  const options = parseArguments(argv);
  if (options.help) {
    printHelp();
    return;
  }
  if (options.version) {
    console.log(packageJson.version);
    return;
  }
  await createWorkspace(options);
}
