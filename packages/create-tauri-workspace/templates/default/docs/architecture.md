# Architecture

The frontend owns presentation and user interaction. It accesses native
capabilities only through explicit Tauri commands in `crates/app`.

`text
React UI
   │ invoke
   ▼
Tauri app shell
   ├── core       business rules
   ├── common     serialized contracts
   ├── platform   OS-specific information
   ├── storage    local path policy
   └── updater    release channel policy
`

Keep `core` independent from Tauri so its behavior can be unit tested and
reused without a desktop runtime. Split new crates only when a real dependency
or ownership boundary appears.
