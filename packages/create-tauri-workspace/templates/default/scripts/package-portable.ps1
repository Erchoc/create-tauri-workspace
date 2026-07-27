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

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root
bun run tauri build --target $Target --no-bundle

$Executable = Join-Path $Root "target/$Target/release/__PROJECT_SLUG__.exe"
$ReleaseDirectory = Join-Path $Root "release"
$StagingDirectory = Join-Path $ReleaseDirectory "__PROJECT_DISPLAY_NAME__-portable-$Architecture"
$Archive = "$StagingDirectory.zip"

if (!(Test-Path $Executable)) {
  throw "Expected executable was not produced: $Executable"
}

New-Item -ItemType Directory -Force -Path $StagingDirectory | Out-Null
Copy-Item $Executable (Join-Path $StagingDirectory "__PROJECT_SLUG__.exe")
Copy-Item (Join-Path $Root "LICENSE") $StagingDirectory

if (Test-Path $Archive) {
  Remove-Item $Archive
}

Compress-Archive -Path "$StagingDirectory/*" -DestinationPath $Archive
Write-Host "Created $Archive"
