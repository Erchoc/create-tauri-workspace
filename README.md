# create-tauri-workspace

[![CI](https://github.com/erchoc/create-tauri-workspace/actions/workflows/ci.yml/badge.svg)](https://github.com/erchoc/create-tauri-workspace/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/create-tauri-workspace.svg)](https://www.npmjs.com/package/create-tauri-workspace)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Runtime dependencies: 0](https://img.shields.io/badge/runtime_dependencies-0-2ea44f.svg)](./packages/create-tauri-workspace/package.json)

Generate a Tauri 2 desktop workspace for macOS and Windows with signed
automatic updates, a design token system, and release workflows already wired
together.

![Generated desktop application](./docs/assets/preview.png)

## Quick start

```bash
npx create-tauri-workspace my-app --identifier dev.you.myapp --repo you/my-app
cd my-app
bun run dev
```

The project name is the only required input. The generator derives the
directory, display name, npm workspace names, and Rust crate names from it.

## What this repository contains

| Part | Location | Purpose |
| --- | --- | --- |
| Generator | `packages/create-tauri-workspace/` | The zero-dependency npm CLI |
| Template | `packages/create-tauri-workspace/templates/default/` | The application it generates |
| Skill | `packages/create-tauri-workspace/skills/desktop-app/` | Guidance Claude Code and Codex both read |
| Site | `site/` | The documentation page published to GitHub Pages |

## What the generated application already does

- **Signed automatic updates**, off until `bun run updater:init` generates a
  key. The updater plugin is not registered without one, so the interface never
  offers an install it cannot verify.
- **A design token system** with light and dark themes and a theme control in
  the window. Colours, spacing and radii live in one file.
- **Two Rust crates with a real boundary.** `crates/core` is testable and never
  depends on Tauri; `crates/app` adapts it to the desktop shell.
- **Desktop basics**: single-instance launch, restored window position,
  structured logs, persisted settings, and an error boundary.
- **Release workflows** that verify the tag, the version, and the signing secret
  before any platform starts building, then publish a draft release.
- **Agent guidance**: one `AGENTS.md`, imported by `CLAUDE.md`.

## Install the skill

Claude Code and Codex read the same `SKILL.md` format from different
directories, so one copy serves both:

```bash
npx create-tauri-workspace skill install            # this project
npx create-tauri-workspace skill install --global   # every project
```

| Tool | Installed to |
| --- | --- |
| Claude Code | `.claude/skills/desktop-app/` |
| Codex | `.agents/skills/desktop-app/` |

Claude Code can also install it as a plugin:

```text
/plugin marketplace add erchoc/create-tauri-workspace
/plugin install desktop-app@create-tauri-workspace
```

## CLI

```text
create-tauri-workspace [project-name] [options]
create-tauri-workspace skill install [options]

Options:
  --output <directory>  Parent directory for the new project
  --identifier <id>     Bundle identifier, such as com.example.app
  --repo <owner/name>   GitHub repository used for update downloads
  --no-install          Do not run bun install
  --no-git              Do not initialize a Git repository
  -h, --help            Show help
  -v, --version         Show version
```

If Bun is not installed, generation still succeeds and prints the remaining
setup commands.

## Generated workspace

```text
my-app/
├── AGENTS.md             Shared repository guidance for coding agents
├── CLAUDE.md             Imports AGENTS.md for Claude Code
├── apps/desktop/         React 19, Vite, design tokens and components
├── crates/app/           Tauri shell, commands, capabilities, plugins
├── crates/core/          Models, settings storage, framework-independent logic
├── resources/            Desktop icons, bundled defaults, notices
├── installers/           NSIS hooks and per-platform signing notes
├── scripts/              Builds, packaging, updater setup, release checks
├── docs/                 Architecture, design, development, distribution
└── .github/workflows/    Cross-platform CI and draft releases
```

## Requirements

- [Bun](https://bun.sh/) 1.3 or newer
- [Rust](https://www.rust-lang.org/tools/install) stable
- [Tauri platform prerequisites](https://v2.tauri.app/start/prerequisites/)

## Develop the generator

```bash
git clone https://github.com/erchoc/create-tauri-workspace.git
cd create-tauri-workspace
bun install
bun run check
```

`bun run check` runs the CLI tests and verifies the published package contents.
Changes to the template must also be validated by generating a project and
running `bun run check` inside it — CI does this on every push.

```bash
node packages/create-tauri-workspace/bin/create-tauri-workspace.mjs demo-app \
  --output ./work --no-install --no-git
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines and
[PUBLISHING.md](./PUBLISHING.md) for the release process.

## License

MIT
