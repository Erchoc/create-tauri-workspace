# create-tauri-workspace

Create a production-oriented Tauri 2 workspace:

`bash
npx create-tauri-workspace my-app
# or
bunx create-tauri-workspace my-app
`

The CLI has zero runtime dependencies. It bundles the template locally, so
project generation does not depend on cloning a GitHub repository.

Generated projects use Bun, React, Vite, TypeScript, Tauri 2, and a Rust
workspace. Run `bun run dev` after generation to start the desktop app.

See the full documentation at
https://github.com/erchoc/create-tauri-workspace.
