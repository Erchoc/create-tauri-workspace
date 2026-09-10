---
name: desktop-app
description: Build or extend a cross-platform desktop application for macOS and Windows using create-tauri-workspace. Use when someone asks for a desktop app, a Mac or Windows app, a native GUI, an installer, a Tauri project, or asks to add automatic updates, code signing, or notarization to one.
---

# Cross-platform desktop app

This skill builds desktop applications from `create-tauri-workspace`: a Tauri 2
shell with a React frontend, two Rust crates, signed automatic updates, and
release workflows for macOS, Windows, and Linux.

## First, work out which situation you are in

| Situation | Go to |
| --- | --- |
| No project exists yet | [Create a project](#create-a-project) |
| A project exists (its `AGENTS.md` describes `crates/app` and `crates/core`) | [Change a project](#change-a-project) |
| The user wants to publish or update the app | [Ship a release](#ship-a-release) |

Do not scaffold a second project on top of an existing one. If a directory
already contains `crates/app/tauri.conf.json`, it is the project.

## Create a project

Ask for nothing you can infer. The only required input is a name.

```bash
npx create-tauri-workspace <name> --identifier <reverse.domain.name> --repo <owner/repo>
```

- `<name>` becomes the directory, window title, and crate names. Accept plain
  words: "Tea Timer" becomes `tea-timer`.
- `--identifier` is a reverse domain name the user controls, such as
  `dev.hanmeimei.teatimer`. If they have no domain, use their GitHub handle:
  `io.github.<handle>.<app>`. Do not leave the `com.example.` default.
- `--repo` sets the update download location. Omit it only if there is no
  GitHub repository yet, and say that updates need it later.

Then verify the project actually builds before writing any feature code:

```bash
cd <name>
bun run check
```

Report the window is ready with `bun run dev`. Do not run `bun run dev`
yourself in a non-interactive session: it opens a window and does not exit.

## Change a project

**Read `AGENTS.md` in the project first.** It is short and it is authoritative.
Then read the document that matches the change:

| Changing | Read first |
| --- | --- |
| The interface | `docs/design.md` |
| A native command or the Rust side | `docs/architecture.md` |
| Build, release, signing | `docs/distribution.md` |

The rules that break projects most often:

- **Interface work uses design tokens.** Every colour, radius, and spacing
  value lives in `apps/desktop/src/styles/tokens.css`. Never write a literal
  colour anywhere else. Reuse the classes in `components.css` and add to that
  file rather than styling one-off elements.
- **Business logic goes in `crates/core`, not in command handlers.** The core
  crate must not depend on Tauri, which is what keeps it unit testable.
- **A new native command touches four files**: the logic and its test in
  `crates/core`, a thin adapter in `crates/app/src/commands.rs`, registration
  in the `generate_handler!` list in `crates/app/src/lib.rs`, and the typed
  declaration in `apps/desktop/src/lib/bridge.ts`. Missing the last one means
  the call fails at runtime instead of at the type check.
- **Plugin permissions are opt-in.** Add them to
  `crates/app/capabilities/default.json` only when a command needs one.
- **Both themes matter.** Check light and dark, and check the layout at the
  760px minimum window width.

Finish every change with:

```bash
bun run check
```

That runs formatting, TypeScript, Clippy with warnings as errors, and the Rust
tests. Do not report work as done until it passes.

## Ship a release

Three separate signatures exist and they are easy to confuse. Read the table at
the top of `docs/distribution.md` before advising the user about any of them.

### Automatic updates

Free, and the only one that needs no account:

```bash
bun run updater:init --repo <owner/repo> --password <value>
```

Pass `--password` or `--no-password` explicitly: without a terminal the Tauri
CLI's prompt hangs. The command prints the `gh secret set` lines that upload
the private key. Tell the user to back that key up — losing it means installed
copies can never be updated again.

### Signing

- **macOS needs a paid Apple Developer account.** Without notarization,
  Gatekeeper tells everyone who downloads the app that it is damaged, and
  automatic updates cannot replace the app bundle. There is no workaround.
  Say this plainly and early rather than after the user has built something.
- **Windows shows a SmartScreen warning without a certificate.** Users can
  click through it, so this is a polish item, not a blocker.

`docs/distribution.md` lists the exact secrets for both.

### Releasing

```bash
# Same version in package.json and crates/app/tauri.conf.json.
bun run release:check
git tag app-v<version> && git push origin app-v<version>
```

The workflow verifies the tag matches the configured version before any
platform builds, then produces a **draft** release. The user publishes it.

## Honest limits

Say these out loud rather than letting the user discover them:

- Building a macOS app requires a Mac, or the GitHub Actions macOS runner that
  the release workflow already uses.
- An unsigned macOS build cannot be shared with other people.
- Automatic updates only work from a published release, not a draft.
