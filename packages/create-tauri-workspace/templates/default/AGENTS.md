# Project Guide

## Stack

- Tauri 2 desktop shell
- React 19, Vite, and TypeScript frontend
- Bun workspace for development commands
- Rust workspace with `app` and `core` crates

## Architecture

- `apps/desktop/` owns presentation and frontend state.
- `crates/app/` owns the Tauri entry point, commands, permissions, plugins, and
  desktop integration.
- `crates/core/` owns reusable application logic and must not depend on Tauri.
- `resources/` contains native resources bundled with the application.
- `installers/` and `scripts/` contain platform packaging customizations.
- `docs/` explains the architecture, the design system, and distribution.

## Commands

- `bun run doctor` checks this machine's toolchain and reports how to fix it.
- `bun run dev` starts the Tauri development application.
- `bun run frontend:dev` starts the browser-only frontend.
- `bun run check` runs formatting, frontend types, Clippy, and Rust tests.
- `bun run build` builds the current platform's desktop bundle.
- `bun run release:check` reports placeholder release metadata.
- `bun run updater:init` configures signed automatic updates.
- `bun run updater:serve` serves a local build so the update flow can be tested
  without publishing.

## Project Rules

- Keep source code, comments, and documentation in English.
- Put reusable business logic in `crates/core`, not in Tauri command handlers.
- Keep Tauri commands small, typed, and focused on adapting frontend requests to
  core logic.
- Declare every Rust command the frontend calls in `apps/desktop/src/lib/bridge.ts`
  and nowhere else.
- Add a plugin permission to `crates/app/capabilities/default.json` only when a
  command actually needs it.
- Use `#[cfg(target_os = "...")]` for platform-specific Rust behaviour, and keep
  desktop-only plugins behind `#[cfg(desktop)]`.
- Do not add a new crate until it has a distinct dependency or testing boundary.
- Do not use Bun-specific APIs in browser code; Bun is a development tool, not an
  application runtime.
- Do not commit secrets, signing certificates, generated bundles, or local
  environment files. The updater private key never belongs in the repository.
- Run `bun run check` before submitting changes.
- The required Bun, Node.js, and Rust versions are declared once, in `engines`
  in package.json and `rust-version` in Cargo.toml. `scripts/doctor.js` reads
  them; never hard-code a version anywhere else.

## Interface Rules

- Read `docs/design.md` before changing the interface.
- Use the tokens in `apps/desktop/src/styles/tokens.css`. Never write a literal
  colour, radius, or spacing value elsewhere.
- Reuse the classes in `apps/desktop/src/styles/components.css`, and add a class
  there rather than styling a one-off element.
- Verify both light and dark themes, and check layouts at the 760px minimum
  window width with no horizontal overflow.
