# Development

Install the [Tauri platform prerequisites](https://v2.tauri.app/start/prerequisites/),
then run:

```bash
bun install
bun run dev
```

The desktop window uses Vite's development server. A production build embeds
the generated static frontend; Bun and Node.js are not shipped to users.

Run all static checks before committing:

```bash
bun run check
```

The template deliberately avoids a large linting stack. TypeScript, Cargo,
Clippy, and rustfmt provide the baseline checks. Add project-specific tools
only when they solve a concrete problem.
