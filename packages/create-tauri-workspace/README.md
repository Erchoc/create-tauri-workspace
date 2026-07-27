# create-tauri-workspace

A zero-dependency CLI that creates an opinionated Tauri 2 desktop workspace
with Bun, React, Vite, TypeScript, and Rust.

![Generated desktop application](https://raw.githubusercontent.com/erchoc/create-tauri-workspace/main/docs/assets/preview.png)

## Create an app

```bash
npx create-tauri-workspace my-desktop-app
cd my-desktop-app
bun run dev
```

Or use Bun:

```bash
bunx create-tauri-workspace my-desktop-app
```

The generated project includes a two-crate Rust workspace, responsive React
starter UI, native resources, installer customization, platform build scripts,
and cross-platform GitHub Actions.

The CLI uses only Node.js built-in modules and bundles its template locally, so
it does not clone a remote repository during generation.

Documentation: https://github.com/erchoc/create-tauri-workspace
