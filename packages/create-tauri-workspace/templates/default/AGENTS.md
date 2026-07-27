# Project Guide

## Stack

- Tauri 2 desktop shell
- React 19, Vite, and TypeScript frontend
- Bun workspace for development commands
- Rust workspace with `app` and `core` crates

## Architecture

- `apps/desktop/` owns presentation and frontend state.
- `crates/app/` owns the Tauri entry point, commands, permissions, and desktop integration.
- `crates/core/` owns reusable application logic and must not depend on Tauri.
- `resources/` contains native resources bundled with the application.
- `installers/` and `scripts/` contain platform packaging customizations.

## Commands

- `bun run dev` starts the Tauri development application.
- `bun run frontend:dev` starts the browser-only frontend.
- `bun run check` runs frontend checks, Rust checks, formatting, and tests.
- `bun run build` builds the current platform's desktop bundle.

## Project Rules

- Keep source code, comments, and documentation in English.
- Put reusable business logic in `crates/core`, not in Tauri command handlers.
- Keep Tauri commands small, typed, and focused on adapting frontend requests to core logic.
- Use `#[cfg(target_os = "...")]` for platform-specific Rust behavior.
- Do not add a new crate until it has a distinct dependency or testing boundary.
- Do not use Bun-specific APIs in browser code; Bun is a development tool, not an application runtime.
- Do not commit secrets, signing certificates, generated bundles, or local environment files.
- Run `bun run check` before submitting changes.

