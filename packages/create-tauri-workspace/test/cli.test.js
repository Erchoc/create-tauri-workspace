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
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  assertIdentifier,
  assertRepository,
  createWorkspace,
  displayNameFromSlug,
  installSkill,
  normalizeProjectName,
  parseArguments,
  parseSkillArguments,
  inspectEnvironment,
  updateEndpoint,
  TOOLCHAIN,
} from "../src/index.js";
import { parseVersion, satisfies } from "../src/versions.js";

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

test("keeps the toolchain floors in step with the template", () => {
  const templateRoot = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "templates",
    "default",
  );
  const manifest = JSON.parse(
    readFileSync(join(templateRoot, "package.json"), "utf8"),
  );
  const cargo = readFileSync(join(templateRoot, "Cargo.toml"), "utf8");
  const rustVersion = /rust-version = "([^"]+)"/.exec(cargo)?.[1];

  // The generated project declares its own floors so it can stand alone.
  // Those declarations and the CLI's must not drift apart.
  assert.deepEqual(parseVersion(manifest.engines.bun), parseVersion(TOOLCHAIN.bun));
  assert.deepEqual(parseVersion(manifest.engines.node), parseVersion(TOOLCHAIN.node));
  assert.deepEqual(parseVersion(rustVersion), parseVersion(TOOLCHAIN.rust));
});

test("compares toolchain versions the way the doctor needs", () => {
  assert.equal(satisfies("rustc 1.98.1 (48a229cea)", "1.98.0"), true);
  assert.equal(satisfies("rustc 1.94.1", "1.98.0"), false);
  assert.equal(satisfies("v24.0.0", "24.0.0"), true);
  assert.equal(satisfies("v22.22.2", "24.0.0"), false);
  assert.equal(satisfies("1.4.2", "1.4.0"), true);
  assert.equal(satisfies("not a version", "1.0.0"), false);
});

test("reports every required tool with a remedy", () => {
  const checks = inspectEnvironment();
  const required = checks.filter((check) => !check.optional);
  assert.ok(required.length >= 3);

  for (const check of checks) {
    assert.equal(typeof check.label, "string");
    if (!check.ok) {
      assert.ok(check.problem, `${check.label} must explain the problem`);
      assert.ok(
        (check.remedy ?? []).length > 0,
        `${check.label} must suggest a fix`,
      );
    }
  }
});

test("pins CI toolchains that satisfy the declared floors", () => {
  const templateRoot = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "templates",
    "default",
  );

  // A workflow that pins an older Bun than the project requires would fail
  // every generated project's first CI run.
  for (const workflow of ["ci.yml", "release.yml"]) {
    const contents = readFileSync(
      join(templateRoot, ".github", "workflows", workflow),
      "utf8",
    );
    const pins = [...contents.matchAll(/bun-version:\s*([\d.]+)/g)].map(
      (match) => match[1],
    );
    assert.ok(pins.length > 0, `${workflow} must pin a Bun version`);
    for (const pin of pins) {
      assert.ok(
        satisfies(pin, TOOLCHAIN.bun),
        `${workflow} pins Bun ${pin}, below the required ${TOOLCHAIN.bun}`,
      );
    }
  }
});

test("builds generated projects on the same Linux image as this repository", () => {
  const root = dirname(fileURLToPath(import.meta.url));
  const templateWorkflows = join(root, "..", "templates", "default", ".github", "workflows");
  const repositoryWorkflow = readFileSync(
    join(root, "..", "..", "..", ".github", "workflows", "ci.yml"),
    "utf8",
  );

  const used = (contents) =>
    new Set([...contents.matchAll(/ubuntu-[\d.]+/g)].map((match) => match[0]));

  const expected = used(repositoryWorkflow);
  assert.ok(expected.size > 0, "the repository workflow must pin an Ubuntu image");

  // Runner images are retired on a schedule. Pinning the same image in both
  // places means bumping one forces the other, instead of leaving generated
  // projects on an image that has started failing.
  for (const workflow of ["ci.yml", "release.yml"]) {
    for (const image of used(readFileSync(join(templateWorkflows, workflow), "utf8"))) {
      assert.ok(
        expected.has(image),
        `template ${workflow} pins ${image}, which this repository does not use`,
      );
    }
  }
});
