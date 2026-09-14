# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- The update check now always runs on launch. `automaticUpdates` governs only
  the download, so someone who turned it off is still told an update exists and
  gets a button to fetch it, with visible progress. Previously the setting
  silenced the check itself, which left those users unaware of any update.
- The native demo command returns a value instead of a sentence. A string built
  in Rust cannot be translated by the interface, and the old one both hardcoded
  English and named the framework.
- The starter interface no longer names the framework. It describes the
  application being built, so nothing has to be deleted before shipping.
- Every user-visible string moved into `apps/desktop/src/locales/`, and the
  interface follows the operating system language. English and Simplified
  Chinese ship; each locale is typed against the English file, so a missing or
  misspelled key fails the type check instead of reaching a user.
- Letter spacing and negative tracking are switched off for Chinese and
  Japanese, which are Latin devices that pull CJK glyphs apart.
- Replaced `ThemeControl` with a generic `Segmented` component, now used for
  both the theme and the language.
- Updates now download in the background as soon as they are found, and the
  banner appears only once the download has finished and been verified.
  Previously the banner announced an update and the download did not start
  until the user clicked, leaving them watching a progress bar.
- Installing an update now asks first. A modal explains that the application
  will close, install, and reopen; the safe answer holds focus. Previously one
  click downloaded, installed and restarted with no confirmation at all.
- Renamed the `autoUpdateCheck` setting to `automaticUpdates`, because it now
  governs the background download as well as the check.
- The release workflow triggers on `v*` tags instead of `app-v*`.

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
- `bun run demo` and `bun run create` in this repository, so the generator can
  be driven from a checkout without retyping its path. `demo` replaces the
  previous scratch project under `work/` on every run, which the generator
  itself refuses to do.
- `bun run updater:serve`, which finds the signed artifacts of a local build,
  writes the manifest the updater expects, and serves both over HTTP, so the
  whole update flow can be exercised without publishing anything. A debug build
  accepts the `http://` endpoint it prints; a release build refuses it.
- A `ConfirmDialog` component built on the native `<dialog>` element, so the
  modal gets focus trapping, Escape handling and an inert background for free.
- Documentation of exactly how an update reaches a user, how to test the flow
  before shipping it, and how to move downloads off GitHub Releases onto object
  storage behind a custom domain.
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
- Moved every workflow from `ubuntu-22.04` to `ubuntu-24.04`. The 22.04 runner
  image begins deprecation on 2026-09-17 with brownouts that fail jobs, and the
  label was also baked into every generated project. A test now requires the
  template and this repository to pin the same image.
- Updated the Linux build dependencies to the set Tauri currently documents:
  `libayatana-appindicator3-dev` replaces `libappindicator3-dev`, and
  `libxdo-dev` and `libssl-dev` were missing. Verified by a release build.
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

