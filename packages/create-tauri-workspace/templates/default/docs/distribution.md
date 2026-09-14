# Distribution

Shipping a desktop application has three separate signing systems, and they
are easy to confuse:

| Signature | Signs | Needed for | Cost |
| --- | --- | --- | --- |
| Update signature | The update package | Automatic updates on every platform | Free |
| Apple Developer ID | The `.app` and `.dmg` | macOS opening the app at all | Apple Developer Program |
| Windows code signing | The `.exe` installer | Avoiding SmartScreen warnings | Certificate authority |

The update signature is free and self-managed. Start there.

## What happens with no signing at all

A build still succeeds and the bundles still run on your own machine, but:

- **macOS** refuses to open the app for anyone who downloads it. Gatekeeper
  reports that the application "is damaged and can't be opened". This is not a
  warning the user can click through in the normal way.
- **Windows** shows a SmartScreen warning naming an unknown publisher. Users
  can continue through **More info → Run anyway**.
- **Linux** is unaffected.
- **Automatic updates do not work on macOS** even if update signing is set up,
  because the replaced application bundle has no valid signature.

## 1. Turn on automatic updates

```bash
bun run updater:init --repo your-name/your-repo
```

The command generates a signing key pair, writes the public key into
`crates/app/tauri.conf.json`, sets `bundle.createUpdaterArtifacts`, and points
the update endpoint at your GitHub releases. It prints the commands that upload
the private key to your repository secrets:

```bash
gh secret set TAURI_SIGNING_PRIVATE_KEY < ~/.tauri/your-app-updater.key
gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD
```

Pass `--password <value>` or `--no-password` when running without a terminal,
for example from a script.

**Back up the private key.** It is the only thing that lets you update copies
of the application that are already installed. Losing it means every existing
user has to download a new installer by hand.

GitHub Releases hosts the update manifest, so there is no server to run: the
release workflow uploads `latest.json` next to the installers, and the
application reads it from the endpoint written into the configuration.

### How an update reaches a user

**The check always runs on launch**, whatever the download preference says.
Learning that an update exists costs a few kilobytes, and someone who turned
automatic downloads off still wants to know. A failed check stays silent: being
offline is not the user's problem to read about.

What happens next depends on the **Download updates automatically** setting.

*With it on*, the download starts immediately and silently, and the signature is
verified. Nothing is shown until it finishes, because a half-finished download
is not something anyone can act on. Then a banner offers to install.

*With it off*, a banner says a version is available and offers to download.
That download shows progress, because the user asked for it and is waiting.
When it finishes, the same install banner appears.

**Either way the install is a separate, explicit step.** Clicking it opens a
modal explaining that the application will close, install, and reopen; the safe
answer holds focus. Nothing is installed until the user confirms.

Installing is never automatic, because it closes the application. A user with
unsaved work decides when that happens, not the updater.

The last step differs by platform, and the difference is normal:

- **Windows** hands over to the NSIS installer, which closes the application
  and reopens it once it finishes. `installMode` is `passive`, so the user sees
  a progress window but is not asked anything.
- **macOS and Linux** replace the application in place, and the restart is the
  updater's own.

On Windows the process may already be gone before the explicit relaunch runs.
That is expected, not a bug.

`bun run dev` never sees an update: the development binary reports the version
from `tauri.conf.json`, and the endpoint serves that same version.

### Testing it locally, without publishing anything

`bun run dev` never sees an update: the development build reports the version
from `tauri.conf.json`, and so does the endpoint. To exercise the real flow,
serve a newer build from your own machine.

```bash
# 1. Build the version you want to be offered, signed.
#    Set the version in package.json and crates/app/tauri.conf.json first.
export TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/your-app-updater.key)"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="…"
bun run build

# 2. Serve it. This writes the manifest and prints the endpoint.
bun run updater:serve
```

Then, in the copy you want to be updated:

1. Point `plugins.updater.endpoints` at `http://127.0.0.1:8787/latest.json`.
2. Set a **lower** version in `package.json` and `crates/app/tauri.conf.json`.
3. Build and launch it.

The banner should appear within a few seconds of launch.

`updater-serve.js` finds the artifacts by looking for files with a `.sig`
beside them, so it does not need to know each platform's bundle layout. When a
build produced several signed artifacts it serves the one the updater would
pick and says so.

It reads the offered version from the built artifact rather than from
`tauri.conf.json`, because by step 2 the config holds the *lower* version and
reading it there would offer no update at all. macOS `.app.tar.gz` carries no
version in its name, so a sibling from the same build supplies it; if you
built `--bundles app` alone, pass `--version 0.2.0` explicitly.

**A debug build accepts an `http://` endpoint with a warning; a release build
refuses it.** That is deliberate on Tauri's part, and it means local testing
needs no certificate. If you must test a release build this way, set
`"dangerousInsecureTransportProtocol": true` under `plugins.updater` — and
remove it before shipping, or every user's update becomes interceptable.

### Testing the real thing

The local test cannot prove that GitHub Releases serves the manifest correctly,
so do this once before the first real release:

1. Release the current version, and install it from the published artifacts.
2. Raise the version, then tag and release again.
3. **Publish the draft release.** The updater reads
   `/releases/latest/`, which only ever resolves to a published, non-prerelease
   release — a draft is invisible to it. This is the single most common reason
   a tagged release produces no update.
4. Launch the installed copy. The banner should appear within a few seconds.

## 2. Sign and notarize for macOS

Notarization requires a paid Apple Developer Program membership. Export a
**Developer ID Application** certificate from Keychain Access as a `.p12` file,
then add these repository secrets:

| Secret | Value |
| --- | --- |
| `APPLE_CERTIFICATE` | `base64 -i certificate.p12` output |
| `APPLE_CERTIFICATE_PASSWORD` | The password used during export |
| `APPLE_SIGNING_IDENTITY` | `Developer ID Application: Your Name (TEAMID)` |
| `APPLE_ID` | Your Apple ID email address |
| `APPLE_PASSWORD` | An app-specific password, not your account password |
| `APPLE_TEAM_ID` | The ten-character team identifier |

Generate the app-specific password at
[appleid.apple.com](https://appleid.apple.com/) under **Sign-In and Security**.

The release workflow passes every value through and skips signing when a secret
is empty, so a repository without these secrets still produces unsigned builds
instead of failing.

## 3. Sign for Windows

Windows signing needs a certificate from a certificate authority. There are two
practical routes:

- **Azure Trusted Signing** bills monthly and does not require managing a
  certificate file. Add a `signCommand` under `bundle.windows` in
  `crates/app/tauri.conf.json`.
- **An OV or EV certificate** from a certificate authority. Store the
  thumbprint in `bundle.windows.certificateThumbprint` and import the
  certificate on the runner before the build step.

See [installers/windows/README.md](../installers/windows/README.md) for the
configuration details.

Reputation with SmartScreen builds up over time and downloads. A brand new
certificate still shows a warning for a while.

## 4. Release

```bash
# 1. Set the same version in package.json and crates/app/tauri.conf.json.
# 2. Confirm the release metadata is complete.
bun run release:check
bun run check

# 3. Tag and push.
git tag v0.2.0
git push origin v0.2.0
```

The tag starts `.github/workflows/release.yml`. A preflight job verifies the
tag matches the configured version and that the update signing secret exists
before any platform starts building, then macOS, Windows, and Linux builds run
in parallel and upload to a **draft** release. Review the draft and publish it
when the artifacts look right.

The updater only sees a published release, so a draft is safe to discard.

## Hosting updates yourself

GitHub Releases is the default because it needs no infrastructure, but the
updater only requires a URL that returns a manifest. Object storage behind a
custom domain — Cloudflare R2, S3, anything static — works the same way.

Point the endpoint at your own host:

```json
"endpoints": ["https://downloads.example.com/latest.json"]
```

The endpoint may carry variables, which the updater substitutes before the
request: `{{target}}` (`linux`, `windows`, `darwin`), `{{arch}}` (`x86_64`,
`aarch64`, `i686`, `armv7`), and `{{current_version}}`. Static hosting can
ignore them and serve one manifest for every platform.

The manifest is the file `tauri-action` already generates for GitHub Releases,
so the migration is a copy step rather than a rewrite:

```json
{
  "version": "1.2.0",
  "notes": "What changed in this release.",
  "pub_date": "2026-09-10T08:00:00Z",
  "platforms": {
    "darwin-aarch64": { "signature": "<contents of the .sig file>", "url": "https://downloads.example.com/1.2.0/App_aarch64.app.tar.gz" },
    "darwin-x86_64": { "signature": "...", "url": "..." },
    "windows-x86_64": { "signature": "...", "url": "..." },
    "linux-x86_64": { "signature": "...", "url": "..." }
  }
}
```

Only `version`, and each platform's `url` and `signature`, are required. The
`signature` is the literal contents of the artifact's `.sig` file, not a path.

Two things to keep right when you move:

- **Serve the manifest over HTTPS**, and keep the same signing key. The key is
  what makes an untrusted host safe: a tampered download fails verification
  regardless of where it came from.
- **A dynamic endpoint should answer `204 No Content`** when there is no
  update. A static host cannot, which is fine — the client compares versions
  itself.

To keep publishing through GitHub Actions, add a step after `tauri-action`
that uploads the artifacts and `latest.json` to your bucket. Keep the GitHub
Release as the build record even when downloads move.

## Local builds

```bash
# Current platform
bun run build

# macOS universal
./scripts/build-macos.sh

# Linux AppImage and Debian package
./scripts/build-linux.sh

# Windows
./scripts/build-windows.ps1

# Windows portable archive, without installer semantics
./scripts/package-portable.ps1
```

Local builds fail if `bundle.createUpdaterArtifacts` is on and
`TAURI_SIGNING_PRIVATE_KEY` is not set. Export the key first, or pass
`--bundles` with a target that does not produce an update package.

## Replacing the application icon

```bash
# Replace resources/app-icon.svg first, then:
bun run tauri icon resources/app-icon.svg --output resources/icons
```

## Rotating the update key

Changing the update key stops every installed copy from accepting updates,
because they verify against the public key compiled into the version they are
running. Only rotate a key that has leaked, and expect to tell existing users
to reinstall.
