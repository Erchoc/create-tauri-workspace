#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
rustup target add aarch64-apple-darwin x86_64-apple-darwin
bun run tauri build --target universal-apple-darwin --bundles app,dmg
