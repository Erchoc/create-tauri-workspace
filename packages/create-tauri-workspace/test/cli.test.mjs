import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  assertIdentifier,
  assertRepository,
  createWorkspace,
  displayNameFromSlug,
  installSkill,
  normalizeProjectName,
  parseArguments,
  parseSkillArguments,
  updateEndpoint,
} from "../src/cli.mjs";

function allFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? allFiles(path) : [path];
  });
}

test("normalizes a human project name", () => {
  assert.equal(normalizeProjectName("My Desktop App"), "my-desktop-app");
  assert.equal(displayNameFromSlug("my-desktop-app"), "My Desktop App");
  assert.throws(() => normalizeProjectName("123 app"), /start with a letter/);
});

test("parses non-interactive flags", () => {
  const options = parseArguments([
    "demo-app",
    "--no-install",
    "--no-git",
    "--output",
    "./work",
    "--identifier",
    "dev.example.demo",
    "--repo",
    "example/demo",
  ]);
  assert.equal(options.projectName, "demo-app");
  assert.equal(options.install, false);
  assert.equal(options.git, false);
  assert.equal(options.identifier, "dev.example.demo");
  assert.equal(options.repository, "example/demo");
  assert.match(options.output, /work$/);
  assert.throws(() => parseArguments(["demo", "--unknown"]), /Unknown option/);
});

test("rejects malformed identifiers and repositories", () => {
  assert.equal(assertIdentifier("io.github.user.app"), "io.github.user.app");
  assert.throws(() => assertIdentifier("noDots"), /reverse domain name/);
  assert.throws(() => assertIdentifier("has space.app"), /reverse domain name/);
  assert.equal(assertRepository("owner/name"), "owner/name");
  assert.throws(() => assertRepository("owner"), /owner\/name/);
});

test("builds an update endpoint from a repository", () => {
  assert.equal(
    updateEndpoint("acme/notes"),
    "https://github.com/acme/notes/releases/latest/download/latest.json",
  );
  assert.match(updateEndpoint(undefined), /OWNER\/REPOSITORY/);
});

test("generates a fully renamed workspace", async () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), "ctw-"));
  try {
    const destination = await createWorkspace({
      projectName: "Example Desktop",
      output: temporaryRoot,
      install: false,
      git: false,
    });
    const packageJson = JSON.parse(
      readFileSync(join(destination, "package.json"), "utf8"),
    );
    const tauriConfig = JSON.parse(
      readFileSync(
        join(destination, "crates", "app", "tauri.conf.json"),
        "utf8",
      ),
    );
    const rustMain = readFileSync(
      join(destination, "crates", "app", "src", "main.rs"),
      "utf8",
    );

    assert.equal(packageJson.name, "example-desktop");
    assert.equal(tauriConfig.productName, "Example Desktop");
    assert.equal(tauriConfig.identifier, "com.example.example-desktop");
    assert.match(rustMain, /example_desktop_lib::run/);
    assert.deepEqual(readdirSync(join(destination, "crates")).sort(), [
      "app",
      "core",
    ]);
    assert.equal(existsSync(join(destination, ".gitignore")), true);
    assert.equal(existsSync(join(destination, "bun.lock")), true);
    assert.equal(existsSync(join(destination, "AGENTS.md")), true);
    assert.equal(
      readFileSync(join(destination, "CLAUDE.md"), "utf8"),
      "@AGENTS.md\n",
    );

    // Updates stay off until the project generates a signing key, so the
    // shipped configuration must not claim to be ready.
    assert.equal(tauriConfig.plugins.updater.pubkey, "");
    assert.equal(tauriConfig.bundle.createUpdaterArtifacts, false);
    assert.match(tauriConfig.plugins.updater.endpoints[0], /OWNER\/REPOSITORY/);

    const lockfile = JSON.parse(
      readFileSync(join(destination, "bun.lock"), "utf8").replace(
        /,(\s*[}\]])/g,
        "$1",
      ),
    );
    assert.equal(lockfile.workspaces[""].name, "example-desktop");
    assert.equal(existsSync(join(destination, "resources", "locales")), false);

    for (const path of allFiles(destination)) {
      if (/\.(icns|ico|png)$/.test(path)) {
        continue;
      }
      assert.doesNotMatch(readFileSync(path, "utf8"), /__PROJECT_/);
    }
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("does not overwrite an existing destination", async () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), "ctw-existing-"));
  mkdirSync(join(temporaryRoot, "existing-app"));
  try {
    await assert.rejects(
      createWorkspace({
        projectName: "existing-app",
        output: temporaryRoot,
        install: false,
        git: false,
      }),
      /Destination already exists/,
    );
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("applies the identifier and repository options", async () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), "ctw-options-"));
  try {
    const destination = await createWorkspace({
      projectName: "acme-notes",
      output: temporaryRoot,
      identifier: "dev.acme.notes",
      repository: "acme/notes",
      install: false,
      git: false,
    });
    const tauriConfig = JSON.parse(
      readFileSync(
        join(destination, "crates", "app", "tauri.conf.json"),
        "utf8",
      ),
    );
    assert.equal(tauriConfig.identifier, "dev.acme.notes");
    assert.equal(
      tauriConfig.plugins.updater.endpoints[0],
      "https://github.com/acme/notes/releases/latest/download/latest.json",
    );
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("parses skill installation flags", () => {
  const both = parseSkillArguments(["install"]);
  assert.equal(both.action, "install");
  assert.deepEqual(both.targets.sort(), ["claude", "codex"]);
  assert.equal(both.global, false);

  const codexOnly = parseSkillArguments(["install", "--codex", "--global"]);
  assert.deepEqual(codexOnly.targets, ["codex"]);
  assert.equal(codexOnly.global, true);

  assert.throws(
    () => parseSkillArguments(["install", "--nope"]),
    /Unknown option/,
  );
});

test("installs the skill where Claude Code and Codex look for it", () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), "ctw-skill-"));
  try {
    installSkill({
      action: "install",
      global: false,
      output: temporaryRoot,
      targets: ["claude", "codex"],
    });

    for (const directory of [".claude/skills", ".agents/skills"]) {
      const skill = join(
        temporaryRoot,
        ...directory.split("/"),
        "desktop-app",
        "SKILL.md",
      );
      assert.equal(existsSync(skill), true);
      const contents = readFileSync(skill, "utf8");
      assert.match(contents, /^---\nname: desktop-app\n/);
      assert.match(contents, /^description: .{40,1024}$/m);
    }

    // Re-installing must replace, not fail or nest.
    installSkill({
      action: "install",
      global: false,
      output: temporaryRoot,
      targets: ["claude"],
    });
    assert.equal(
      existsSync(
        join(temporaryRoot, ".claude", "skills", "desktop-app", "SKILL.md"),
      ),
      true,
    );
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
