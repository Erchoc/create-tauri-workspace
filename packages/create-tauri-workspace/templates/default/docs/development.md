# Development

Check the machine first:

```bash
bun run doctor
```

It reports the Bun, Node.js, and Rust versions this project needs, whether the
platform webview is installed, and the exact command to fix anything missing.
Then:

```bash
bun install
bun run dev
```

The desktop window uses Vite's development server. A production build embeds
the generated static frontend; Bun and Node.js are not shipped to users.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run doctor` | Toolchain check, with the fix for anything missing |
| `bun run dev` | Vite plus the Tauri window |
| `bun run frontend:dev` | The interface in a browser, with native calls stubbed |
| `bun run check` | Formatting, types, Clippy, and Rust tests |
| `bun run build` | Bundles for the current platform |
| `bun run release:check` | Placeholder and version checks before a release |
| `bun run updater:init` | Sets up signed automatic updates |

Run all checks before committing:

```bash
bun run check
```

`bun run frontend:dev` runs without a Rust backend. `isDesktop` in
`apps/desktop/src/lib/bridge.ts` is false there, and the interface falls back to
placeholder data instead of throwing.

## Adding a native command

1. Put the logic in `crates/core`, with a unit test. It must not reference
   Tauri.
2. Add a thin `#[tauri::command]` adapter in `crates/app/src/commands.rs` and
   register it in the `generate_handler!` list in `crates/app/src/lib.rs`.
3. Declare the call and its types in `apps/desktop/src/lib/bridge.ts`.
4. If the command needs a plugin permission, add it to
   `crates/app/capabilities/default.json`.

## Adding a screen

Read [design.md](./design.md) first. In short: use the tokens in
`apps/desktop/src/styles/tokens.css`, reuse the classes in `components.css`,
and check the result in both themes at the 760px minimum window width.

## Tooling

The template deliberately avoids a large linting stack. TypeScript, Clippy, and
rustfmt provide the baseline. Add project-specific tools only when they solve a
concrete problem.
