# Development

Install the platform prerequisites documented by Tauri, then run:

`bash
bun install
bun run dev
`

The desktop window uses Vite's development server. A production build embeds
the generated static frontend; Bun and Node.js are not shipped to users.

Run all static checks before committing:

`bash
bun run check
`

The template deliberately avoids a large linting stack. TypeScript, Cargo,
Clippy, and rustfmt provide the baseline checks. Add application-specific tools
when the project needs them.
