# create-tauri-workspace

Scaffold a macOS and Windows desktop app with signed automatic updates, a
design token system, and release workflows already wired together.

![The generated application in light and dark themes](https://raw.githubusercontent.com/erchoc/create-tauri-workspace/main/site/preview.png)

## Create an app

```bash
npx create-tauri-workspace my-app --identifier dev.you.myapp --repo you/my-app
cd my-app
bun run dev
```

Only the name is required. Check the machine first with:

```bash
npx create-tauri-workspace doctor
```

## What you get

- **Signed automatic updates**, off until `bun run updater:init` creates a key.
  Without one the updater is never registered, so the app cannot offer an
  install it cannot verify.
- **Design tokens** with light and dark themes and a theme control in the
  window.
- **Two Rust crates with a real boundary.** `crates/core` is testable and never
  depends on Tauri; `crates/app` adapts it to the desktop shell.
- **Desktop basics**: single-instance launch, restored window position,
  structured logs, persisted settings, an error boundary.
- **Release workflows** that check the tag, the version, and the signing secret
  before any platform builds, then publish a draft release.

## Install the skill

Claude Code and Codex read the same `SKILL.md` from different directories, and
this installs it for both:

```bash
npx create-tauri-workspace skill install            # this project
npx create-tauri-workspace skill install --global   # every project
```

## Requirements

| Tool | Minimum |
| --- | --- |
| [Bun](https://bun.sh/) | 1.4 |
| [Node.js](https://nodejs.org/) | 24 |
| [Rust](https://rustup.rs/) | 1.98 |

Plus the [Tauri platform prerequisites](https://v2.tauri.app/start/prerequisites/).
These bind you, not your users: what you ship is a native binary with no
JavaScript runtime inside it.

The CLI itself has no runtime dependencies and bundles its template locally, so
generation never clones a remote repository.

## Links

- Documentation: <https://erchoc.github.io/create-tauri-workspace/>
- 简体中文: <https://erchoc.github.io/create-tauri-workspace/zh/>
- Source: <https://github.com/erchoc/create-tauri-workspace>

MIT licensed.
