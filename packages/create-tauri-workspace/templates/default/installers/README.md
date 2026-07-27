# Installers

Tauri supplies the standard bundlers. This directory contains only
project-owned customizations:

- `windows/nsis/hooks.nsh` extends the NSIS setup without replacing Tauri's
  maintained installer template.
- `macos/README.md` records signing and notarization decisions.
- `linux/README.md` records package-specific metadata.
