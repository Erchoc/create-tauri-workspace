# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Signed automatic updates in the template, set up by `bun run updater:init`.
  The updater plugin registers only when a public key is configured.
- A design token system with light and dark themes, reusable component classes,
  and a theme control in the generated window.
- Persisted user settings, backed by the bundled `resources/defaults/settings.json`.
- Single-instance launch, window state restoration, structured logging, and an
  interface error boundary.
- A release preflight job that checks the tag, the version, and the update
  signing secret before any platform builds, plus pass-through for Apple
  signing and notarization secrets.
- `--identifier` and `--repo` options, so a generated project needs no manual
  configuration edit before its first release.
- A `skill install` subcommand that installs the `desktop-app` skill for both
  Claude Code and Codex, and a Claude Code plugin marketplace manifest.
- A documentation site in `site/`, deployed to GitHub Pages.
- `bun run verify:package`, which asserts the published tarball's contents, and
  a CI job that generates a project and runs its checks.
- A `bun.lock` in the template, so `bun install --frozen-lockfile` is meaningful.
- `create-tauri-workspace doctor` and `bun run doctor`, which report whether a
  machine has the Bun, Node.js, Rust, and platform prerequisites this project
  needs, and print the exact command to fix anything missing. Generation runs
  the same check and warns without blocking.
- A Simplified Chinese translation of the README.
- A Simplified Chinese version of the documentation site, with a language
  switcher, plus social card metadata, canonical URLs, `robots.txt`, and a
  sitemap.
- `bun run verify:site`, which asserts both site pages share the same sections,
  link to each other, and reference no missing files.
- A Dependabot configuration for this repository's workflows and tooling. It
  deliberately excludes the template, whose manifests are placeholders an
  install would overwrite.

### Changed

- `bun run check` in the generated project now also runs `cargo test`.
- The generated `docs/` gained `design.md` and a rewritten `distribution.md`
  covering update signing, Apple notarization, and Windows code signing.
- Split the single 484-line CLI file into one module per concern, matching the
  layout of comparable project generators.
- Renamed every `.mjs` file to `.js`, and declared `"type": "module"` in both
  manifests.
- Raised the required toolchain to Bun 1.4, Node.js 24, and Rust 1.98. The
  floors are declared once and a test fails if the CLI and the template drift
  apart. They bind contributors only; a shipped application contains no
  JavaScript runtime.
- Moved the screenshots into `site/`, so the page and the READMEs share one
  copy instead of two.
- Renamed the Pages workflow to `publish-site.yml`, matching `publish-npm.yml`.
- Replaced the stale repository-creation section of `PUBLISHING.md` with the
  one-time settings that are not in version control, and documented what losing
  an npm 2FA device costs.

## [0.1.0] - 2026-07-27

### Added

- Zero-dependency project generator with `npx` and `bunx` entry points.
- Tauri 2, Bun, React, Vite, TypeScript, and Rust workspace template.
- Responsive starter interface and typed React-to-Rust command example.
- Native resources, NSIS hooks, platform scripts, and GitHub Actions.
- CLI tests, npm tarball verification, and release documentation.

[Unreleased]: https://github.com/erchoc/create-tauri-workspace/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/erchoc/create-tauri-workspace/releases/tag/v0.1.0

