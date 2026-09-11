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

```bash
git clone https://github.com/erchoc/create-tauri-workspace.git
cd create-tauri-workspace
bun install

bun run demo        # generates work/demo-app from this checkout
cd work/demo-app
bun run dev
```

`bun run demo` replaces the previous scratch project each time, so it is safe
to repeat after every change. Pass a name for a second one: `bun run demo
notes-app`. Everything under `work/` is ignored by git.

For a real project, or to pass your own options, use `bun run create`, which is
the CLI itself:

```bash
bun run create my-app \
  --output ~/Projects --identifier dev.you.myapp --repo you/my-app
```

Always drive the generator from the checkout rather than from npm, which lags
behind. `bun run doctor` checks your machine and needs no install at all — the
CLI has no dependencies.

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
bun run demo && cd work/demo-app && bun run check
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
