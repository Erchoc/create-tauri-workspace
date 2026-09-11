# Contributing

Thanks for helping improve `create-tauri-workspace`.

## Principles

- Keep the generator dependency-free unless a dependency provides a clear
  benefit that cannot be implemented safely with Node.js built-ins.
- Keep the default template useful but small.
- Add optional features only after they have a complete implementation.
- Preserve Windows, macOS, and Linux support.
- Keep code, documentation, CLI output, and generated content in English.

## Trying it on your own machine

The CLI has no dependencies, so a fresh clone can check your machine before you
install anything:

```bash
git clone https://github.com/erchoc/create-tauri-workspace.git
cd create-tauri-workspace
node packages/create-tauri-workspace/bin/create-tauri-workspace.js doctor
```

Generate a project from the checkout rather than from npm, which may be behind:

```bash
node packages/create-tauri-workspace/bin/create-tauri-workspace.js my-app \
  --output ~/Projects --identifier dev.you.myapp --repo you/my-app

cd ~/Projects/my-app
bun run dev
```

The first `bun run dev` compiles the Rust side and takes a few minutes. Later
runs are seconds. `bun run frontend:dev` opens the interface in a browser
immediately, with native calls stubbed — useful for design work, useless for
anything that needs Rust.

### What to exercise, and what each thing proves

| Try | Proves |
| --- | --- |
| The theme control, then relaunch | Settings persist to the platform config directory |
| Launch a second copy while one runs | Single-instance: the running window is focused |
| Move the window, quit, relaunch | Window position is restored |
| Type a name and press Invoke | The React to Rust command path works |
| `bun run check` | Formatting, types, Clippy and Rust tests |
| `bun run release:check` | Catches placeholder release metadata |
| `bun run doctor` | Reports a toolchain problem and how to fix it |

Updates need their own setup — see `docs/distribution.md` in the generated
project, under **Testing it locally**. In short: build a signed high version,
`bun run updater:serve`, roll the project back to a lower version pointed at
the printed endpoint, and launch it.

## Development

```bash
bun install
bun run check
```

Changes to the bundled template must also be tested by creating a project and
running `bun run check` inside it:

```bash
node packages/create-tauri-workspace/bin/create-tauri-workspace.js demo-app \
  --output ./work --identifier dev.example.demo --repo example/demo --no-git
cd work/demo-app && bun run check
```

Never run a build inside `templates/default/`. The template is copied verbatim,
so a stray `target/` or `node_modules/` directory ends up in the published
package. `bun run verify:package` fails if one does.

Interface changes need a screenshot in both light and dark themes, checked at
the 760px minimum window width.

## Pull requests

Use a focused branch and a Conventional Commit title. Explain user-visible
behavior, include validation results, and attach a screenshot for visual
changes.
