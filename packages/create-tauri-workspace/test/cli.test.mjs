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
  createWorkspace,
  displayNameFromSlug,
  normalizeProjectName,
  parseArguments,
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
  ]);
  assert.equal(options.projectName, "demo-app");
  assert.equal(options.install, false);
  assert.equal(options.git, false);
  assert.match(options.output, /work$/);
  assert.throws(() => parseArguments(["demo", "--unknown"]), /Unknown option/);
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
    assert.equal(existsSync(join(destination, "AGENTS.md")), true);
    assert.equal(
      readFileSync(join(destination, "CLAUDE.md"), "utf8"),
      "@AGENTS.md\n",
    );
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
