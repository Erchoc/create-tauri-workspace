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
running `bun run check` inside it.

## Pull requests

Use a focused branch and a Conventional Commit title. Explain user-visible
behavior, include validation results, and attach a screenshot for visual
changes.
