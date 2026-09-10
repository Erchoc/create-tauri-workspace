# macOS distribution

Direct distribution requires Developer ID signing and Apple notarization.
Without both, Gatekeeper reports that the downloaded application is damaged and
refuses to open it, and automatic updates cannot replace the application
bundle.

See [docs/distribution.md](../../docs/distribution.md) for the secrets the
release workflow expects.

## Entitlements

This template ships no entitlements file. A standard Tauri application
notarizes without one, and every entitlement widens what the application is
allowed to do.

Add `bundle.macOS.entitlements` in `crates/app/tauri.conf.json` only when a
capability requires it, and add one key at a time.

## Universal binaries

`scripts/build-macos.sh` builds `universal-apple-darwin`, so a single download
covers both Apple silicon and Intel machines. The release workflow does the
same.
