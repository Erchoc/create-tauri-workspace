# Windows distribution

The release workflow builds an NSIS setup executable for x64 and arm64. The
setup installs for the current user, so updates do not need an elevation
prompt.

## WebView2

`webviewInstallMode` is set to `downloadBootstrapper`, so the setup fetches the
Evergreen runtime when the machine does not already have it. Windows 11 and
recent Windows 10 installations ship with it.

## Code signing

Unsigned installers trigger a SmartScreen warning that names an unknown
publisher. Two configurations avoid it.

### Azure Trusted Signing

Add a sign command under `bundle.windows` in `crates/app/tauri.conf.json`:

```json
"windows": {
  "signCommand": "trusted-signing-cli -e https://ENDPOINT -a ACCOUNT -c PROFILE %1"
}
```

The runner needs `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, and
`AZURE_TENANT_ID` in the environment, and `trusted-signing-cli` installed
before the build step.

### A certificate file

Import the certificate on the runner, then reference its thumbprint:

```json
"windows": {
  "certificateThumbprint": "A1B2C3...",
  "digestAlgorithm": "sha256",
  "timestampUrl": "http://timestamp.digicert.com"
}
```

Always set a timestamp URL. Without one, signatures stop validating when the
certificate expires.

## Portable builds

`scripts/package-portable.ps1` zips the unbundled executable. A portable build
has no installer, no uninstall entry, and no automatic updates. Treat it as a
convenience download rather than the primary distribution channel.
