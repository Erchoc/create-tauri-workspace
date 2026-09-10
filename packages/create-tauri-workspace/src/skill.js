import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import { skillRoot } from "./paths.js";
import { ansi, printStep } from "./terminal.js";

export const SKILL_NAME = "desktop-app";

// Claude Code and Codex read the same SKILL.md format from different
// directories, so one copy in this package serves both.
export const SKILL_TARGETS = {
  claude: { label: "Claude Code", directory: join(".claude", "skills") },
  codex: { label: "Codex", directory: join(".agents", "skills") },
};

export function installSkill(options) {
  const source = join(skillRoot, SKILL_NAME);
  if (!existsSync(source)) {
    throw new Error("This package does not contain a skill to install.");
  }

  const base = options.global ? homedir() : options.output;
  const installed = [];

  for (const target of options.targets) {
    const definition = SKILL_TARGETS[target];
    if (!definition) {
      throw new Error(`Unknown skill target: ${target}`);
    }
    const destination = join(base, definition.directory, SKILL_NAME);
    mkdirSync(dirname(destination), { recursive: true });
    rmSync(destination, { force: true, recursive: true });
    cpSync(source, destination, { recursive: true });
    printStep(definition.label, destination);
    installed.push(destination);
  }

  console.log(
    `\n${ansi.green("Done.")} Ask for a desktop app and the skill will be used.`,
  );

  return installed;
}
