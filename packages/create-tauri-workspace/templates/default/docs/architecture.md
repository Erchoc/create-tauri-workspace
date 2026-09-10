# Architecture

The frontend owns presentation and user interaction. It accesses native
capabilities only through explicit Tauri commands in `crates/app`.

```text
React UI
   │ typed invoke, declared once in apps/desktop/src/lib/bridge.ts
   ▼
Tauri app shell (crates/app)
   ├── commands   thin adapters between the frontend and core
   ├── settings   reads the user file, falls back to bundled defaults
   └── updater    registered only when a signing key is configured
   │
   ▼
Core crate (crates/core)
   ├── model      serialized contracts and user settings
   ├── platform   OS and architecture information
   └── storage    local data path policy and atomic writes
```

The core crate does not depend on Tauri. Its behaviour can be unit tested and
reused without starting a desktop runtime.

## Boundaries

- `crates/core` must not gain a Tauri dependency. If a feature needs one, the
  adapter belongs in `crates/app`.
- `apps/desktop` names a Rust command in exactly one place,
  `src/lib/bridge.ts`, so a rename fails the type check instead of failing at
  runtime.
- Keep the workspace at two crates until a feature introduces a genuine
  dependency or ownership boundary.

## Security posture

The desktop shell exposes one named capability and a restrictive Content
Security Policy in production. Extend both deliberately when adding native
commands or remote resources.

The updater is the clearest example: `crates/app/src/updater.rs` registers the
plugin only when a public key is present in the configuration. A project that
has not run `bun run updater:init` cannot verify a download, so the plugin
stays unregistered and the interface hides the update controls rather than
offering an install it cannot check.

## Failure behaviour

Reading settings never blocks start-up. The user file is preferred, the bundled
`resources/defaults/settings.json` is next, and compiled defaults are last;
each fallback is logged. A rendering failure is caught by the error boundary in
`apps/desktop/src/components/ErrorBoundary.tsx`, because a packaged build has
no developer tools to open.
