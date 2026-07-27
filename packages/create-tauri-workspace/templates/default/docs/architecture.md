# Architecture

The frontend owns presentation and user interaction. It accesses native
capabilities only through explicit Tauri commands in `crates/app`.

```text
React UI
   │ typed invoke
   ▼
Tauri app shell
   │
   ▼
Core crate
   ├── model       serialized contracts
   ├── platform    OS and architecture information
   └── storage     local data path policy
```

The core crate does not depend on Tauri. Its behavior can be unit tested and
reused without starting a desktop runtime.

The desktop shell exposes only its named capability and enables a restrictive
Content Security Policy in production. Extend both deliberately when adding
native commands or remote resources.

Keep the workspace at two crates until a feature introduces a genuine
dependency or ownership boundary. A database, updater, or platform integration
should not become a crate before it has a complete implementation.
