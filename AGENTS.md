# Repository Guide

## Purpose

This repository publishes `create-tauri-workspace`, a zero-runtime-dependency
CLI that generates a polished Tauri 2 desktop workspace, together with the skill
that Claude Code and Codex use to drive it.

## Structure

- `packages/create-tauri-workspace/bin/` is the executable entry point.
- `packages/create-tauri-workspace/src/` holds one module per concern:
  `index` dispatches, `options` parses arguments, `project` scaffolds, `skill`
  installs, `doctor` and `requirements` check the machine, `versions`,
  `shell`, `terminal`, and `paths` are shared helpers.
- `packages/create-tauri-workspace/templates/default/` is the generated application.
- `packages/create-tauri-workspace/skills/desktop-app/` is the skill, and also the Claude Code plugin source.
- `.claude-plugin/marketplace.json` publishes that skill as a plugin.
- `site/` is the documentation page deployed to GitHub Pages, and holds the screenshots the READMEs link to. `site/index.html` is English and `site/zh/index.html` is its translation.
- `work/` is ignored scratch space for generated smoke-test projects.

## Commands

- `bun run doctor` checks this machine's toolchain.
- `bun run test` runs the CLI test suite.
- `bun run check` runs tests and verifies the npm package contents.
- `bun run verify:package` asserts the tarball's file list, size, and contents.
- `bun run verify:site` asserts both site pages share the same sections, link to
  each other, and reference no missing files.
- `bun run skill:install` installs the skill into this checkout for dogfooding.
- `npm run publish` performs guarded checks and interactively publishes the npm package.

After changing the template, generate a fresh application and run `bun run check`
inside it. CI does the same on every push.

## Project Rules

- Keep all source code, comments, CLI output, and documentation in English.
  Translations are the exception: `README.zh-CN.md` tracks `README.md`, and
  `site/zh/index.html` tracks `site/index.html`. Change the English source
  first, then the translation in the same commit.
- Keep JavaScript files on the `.js` extension. Both manifests declare
  `"type": "module"`, so plain `.js` is already ESM.
- Declare the required Bun, Node.js, and Rust versions in
  `src/requirements.js`, and mirror them in the template's `engines` and
  `rust-version`. A test fails when the two drift apart.
- Keep the CLI free of runtime dependencies; prefer Node.js built-in modules.
- Keep the generated Rust workspace focused on `crates/app` and `crates/core` until a real boundary justifies another crate.
- Keep Bun as a development tool only. Generated desktop applications must not ship a JavaScript runtime.
- Preserve every `__PROJECT_*__` placeholder unless the generator intentionally replaces it.
- Never run a build inside `templates/default/`. Generated `target/`, `node_modules/`, and `Cargo.lock` must not reach the published package; `bun run verify:package` fails if they do.
- Keep the skill in one place. It is copied to `.claude/skills/` and `.agents/skills/` at install time, never duplicated in the repository.
- Never point Dependabot at `templates/default`. Its manifests are placeholders,
  and an install there would rewrite `bun.lock` with resolved names and destroy
  them. `.github/dependabot.yml` records this.
- Do not commit generated projects, build output, signing credentials, or publishing tokens.
- Validate UI changes at desktop and narrow viewport sizes, with no horizontal overflow, in both light and dark themes.
