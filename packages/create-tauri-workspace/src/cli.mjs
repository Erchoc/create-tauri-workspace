import { spawnSync } from "node:child_process";
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
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import process from "node:process";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const templateRoot = join(packageRoot, "templates", "default");
const packageJson = JSON.parse(
  readFileSync(join(packageRoot, "package.json"), "utf8"),
);
const colorEnabled = Boolean(process.stdout.isTTY && !process.env.NO_COLOR);

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

export function parseArguments(argv) {
  const options = {
    projectName: undefined,
    output: process.cwd(),
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
      "",
      "Options:",
      "  --output <directory>  Parent directory for the project",
      "  --no-install          Skip bun install",
      "  --no-git              Skip git init",
      "  -h, --help            Show this help",
      "  -v, --version         Show the CLI version",
      "",
      "Examples:",
      "  npx create-tauri-workspace my-app",
      "  bunx create-tauri-workspace my-app --no-git",
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

  replaceTokens(destination, {
    "__PROJECT_DISPLAY_NAME__": displayName,
    "__PROJECT_IDENTIFIER__": "com.example." + slug,
    "__PROJECT_RUST_LIB__": slug.replaceAll("-", "_") + "_lib",
    "__PROJECT_SLUG__": slug,
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
  console.log(
    "\nBefore publishing, replace " +
      JSON.stringify("com.example." + slug) +
      " in crates/app/tauri.conf.json.",
  );

  return destination;
}

export async function main(argv = process.argv.slice(2)) {
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
