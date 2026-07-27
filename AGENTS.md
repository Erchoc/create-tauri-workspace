# Repository Guide

## Purpose

This repository publishes `create-tauri-workspace`, a zero-runtime-dependency CLI that generates a polished Tauri 2 desktop workspace.

## Structure

- `packages/create-tauri-workspace/` contains the npm CLI.
- `packages/create-tauri-workspace/templates/default/` contains the generated application.
- `docs/` contains public project assets.
- `work/` is ignored scratch space for generated smoke-test projects.

## Commands

- `bun run test` runs the CLI test suite.
- `bun run check` runs tests and verifies the npm package contents.
- `npm pack --workspace packages/create-tauri-workspace --dry-run` previews the published package.
- `npm run publish` performs guarded checks and interactively publishes the npm package.

After changing the template, generate a fresh application and run `bun run check` inside it.

## Project Rules

- Keep all source code, comments, CLI output, and public documentation in English.
- Keep the CLI free of runtime dependencies; prefer Node.js built-in modules.
- Keep the generated Rust workspace focused on `crates/app` and `crates/core` until a real boundary justifies another crate.
- Keep Bun as a development tool only. Generated desktop applications must not ship a JavaScript runtime.
- Preserve every `__PROJECT_*__` placeholder unless the generator intentionally replaces it.
- Do not commit generated projects, build output, signing credentials, or publishing tokens.
- Validate UI changes at desktop and narrow viewport sizes, with no horizontal overflow.
