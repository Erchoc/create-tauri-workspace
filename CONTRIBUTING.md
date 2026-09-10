# Contributing

Thanks for helping improve `create-tauri-workspace`.

## Principles

- Keep the generator dependency-free unless a dependency provides a clear
  benefit that cannot be implemented safely with Node.js built-ins.
- Keep the default template useful but small.
- Add optional features only after they have a complete implementation.
- Preserve Windows, macOS, and Linux support.
- Keep code, documentation, CLI output, and generated content in English.

## Development

```bash
bun install
bun run check
```

Changes to the bundled template must also be tested by creating a project and
running `bun run check` inside it:

```bash
node packages/create-tauri-workspace/bin/create-tauri-workspace.mjs demo-app \
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
