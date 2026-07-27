# create-tauri-workspace

A small, opinionated Tauri 2 workspace generator powered by Bun, React, Vite,
TypeScript, and Rust.

`create-tauri-workspace` is intentionally different from a minimal one-folder
starter. It creates a maintainable desktop workspace with separate frontend,
Tauri shell, reusable Rust crates, application resources, installer
customization, release scripts, and GitHub Actions.

## Create an app

`bash
npx create-tauri-workspace my-app
`

or:

`bash
bunx create-tauri-workspace my-app
`

The only project-specific input is the application name. The generator derives
the directory name, display name, npm package names, Rust crate names, and a
placeholder Tauri identifier from it.

## What is generated

`text
my-app/
├── apps/desktop/          React 19 + Vite + TypeScript
├── crates/
│   ├── app/               Tauri shell and IPC commands
│   ├── common/            Shared serializable models
│   ├── core/              Framework-independent logic
│   ├── platform/          OS and architecture abstraction
│   ├── storage/           Local data path policy
│   └── updater/           Update channel policy
├── resources/             Icons, defaults, locales, notices
├── installers/            NSIS hooks and platform notes
├── scripts/               Platform builds and portable packaging
├── docs/                  Architecture, development, distribution
└── .github/workflows/     Cross-platform CI and release builds
`

The generator itself has zero runtime dependencies and uses only Node.js
built-in modules. Generated applications depend only on the core Tauri, React,
Vite, and TypeScript packages needed by the template.

## CLI

`text
create-tauri-workspace [project-name] [options]

Options:
  --output <directory>  Parent directory for the new project
  --no-install          Do not run bun install
  --no-git              Do not initialize a Git repository
  -h, --help            Show help
  -v, --version         Show version
`

If Bun is not installed, generation still succeeds and prints the command to
run after installing Bun.

## Local development

`bash
bun install
bun run check

# Test the unpublished creator
node packages/create-tauri-workspace/bin/create-tauri-workspace.mjs demo-app \
  --output ./work \
  --no-install \
  --no-git
`

## Publishing

See [PUBLISHING.md](./PUBLISHING.md) for GitHub and npm release steps.

## License

MIT
