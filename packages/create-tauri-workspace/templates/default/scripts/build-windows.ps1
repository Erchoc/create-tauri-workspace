param(
  [ValidateSet("x64", "arm64")]
  [string]$Architecture = "x64"
)

$ErrorActionPreference = "Stop"
$Target = if ($Architecture -eq "arm64") {
  "aarch64-pc-windows-msvc"
} else {
  "x86_64-pc-windows-msvc"
}

Set-Location (Join-Path $PSScriptRoot "..")
rustup target add $Target
bun run tauri build --target $Target --bundles nsis
