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
git tag app-v0.2.0
git push origin app-v0.2.0
```

The tag starts `.github/workflows/release.yml`. A preflight job verifies the
tag matches the configured version and that the update signing secret exists
before any platform starts building, then macOS, Windows, and Linux builds run
in parallel and upload to a **draft** release. Review the draft and publish it
when the artifacts look right.

The updater only sees a published release, so a draft is safe to discard.

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
