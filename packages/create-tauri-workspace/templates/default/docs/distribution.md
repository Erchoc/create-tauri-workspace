# Distribution

## Required release changes

1. Replace `__PROJECT_IDENTIFIER__` in `crates/app/tauri.conf.json`.
2. Replace `resources/app-icon.svg` and regenerate icons with
   `bun run tauri icon resources/app-icon.svg --output resources/icons`.
3. Configure platform code signing.
4. Run `bun run release:check` and `bun run check`.

## Local builds

`bash
# Current platform
bun run build

# macOS universal
./scripts/build-macos.sh

# Linux AppImage and Debian package
./scripts/build-linux.sh

# Windows PowerShell
./scripts/build-windows.ps1
`

Windows users receive an NSIS setup executable. The setup uses WebView2's
download bootstrapper if the Evergreen runtime is missing. MSI can be added for
enterprise deployment. The portable script packages the unbundled Windows
binary separately and does not pretend that portable mode has installer
semantics.

The included GitHub workflow builds on each native operating system. Production
releases still require signing secrets and platform accounts.
