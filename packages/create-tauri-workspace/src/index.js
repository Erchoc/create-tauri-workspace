import process from "node:process";

import { doctorCommand, runDoctor } from "./doctor.js";
import { parseArguments, parseSkillArguments } from "./options.js";
import { manifest } from "./paths.js";
import { createWorkspace } from "./project.js";
import { installSkill } from "./skill.js";
import { ansi } from "./terminal.js";

export {
  assertIdentifier,
  assertRepository,
  parseArguments,
  parseSkillArguments,
  updateEndpoint,
} from "./options.js";
export {
  createWorkspace,
  displayNameFromSlug,
  normalizeProjectName,
} from "./project.js";
export { SKILL_NAME, SKILL_TARGETS, installSkill } from "./skill.js";
export { TOOLCHAIN, inspectEnvironment } from "./requirements.js";
export { runDoctor } from "./doctor.js";

function printHelp() {
  console.log(
    [
      `${ansi.bold("create-tauri-workspace")} ${ansi.dim(`v${manifest.version}`)}`,
      "Create a cross-platform Tauri 2 desktop workspace.",
      "",
      "Usage:",
      `  ${ansi.cyan("create-tauri-workspace")} [project-name] [options]`,
      `  ${ansi.cyan("create-tauri-workspace skill install")} [options]`,
      `  ${ansi.cyan("create-tauri-workspace doctor")}`,
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
      "  npx create-tauri-workspace my-app --identifier dev.acme.notes \\",
      "    --repo acme/notes",
      "  npx create-tauri-workspace doctor",
    ].join("\n"),
  );
}

function printSkillHelp() {
  console.log(
    [
      `${ansi.bold("create-tauri-workspace skill")} ${ansi.dim(`v${manifest.version}`)}`,
      "Install the desktop-app skill for Claude Code and Codex.",
      "",
      "Usage:",
      `  ${ansi.cyan("create-tauri-workspace skill install")} [options]`,
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

function skillCommand(argv) {
  const options = parseSkillArguments(argv);
  if (options.help || options.action === undefined) {
    printSkillHelp();
    return;
  }
  if (options.action !== "install") {
    throw new Error(`Unknown skill action: ${options.action}`);
  }
  installSkill(options);
}

export async function main(argv = process.argv.slice(2)) {
  if (argv[0] === "skill") {
    skillCommand(argv.slice(1));
    return;
  }

  if (argv[0] === "doctor") {
    doctorCommand();
    return;
  }

  const options = parseArguments(argv);
  if (options.help) {
    printHelp();
    return;
  }
  if (options.version) {
    console.log(manifest.version);
    return;
  }

  // Reports only when something is missing or out of date. Generation still
  // works on an unprepared machine; the project just will not build yet.
  if (runDoctor({ quiet: true }) > 0) {
    console.log(
      ansi.dim(
        "Continuing anyway. The project will generate, but it cannot build until the above is fixed.\n",
      ),
    );
  }

  await createWorkspace(options);
}
