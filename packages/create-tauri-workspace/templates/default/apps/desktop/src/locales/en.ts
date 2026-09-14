// The source language. Every other locale is typed against this object, so a
// missing or misspelled key fails the type check instead of showing a raw key
// to a user.
export const en = {
  "app.tagline":
    "A desktop application for macOS and Windows, with everything already wired up.",

  "theme.label": "Colour theme",
  "theme.system": "Auto",
  "theme.light": "Light",
  "theme.dark": "Dark",

  "language.label": "Language",
  "language.system": "Auto",

  "status.ready": "Ready",

  "demo.label": "Example",
  "demo.title": "Call native code",
  "demo.name": "Name",
  "demo.submit": "Run",
  "demo.browserHint": "Run the desktop application to reach the native side.",
  "demo.result": "The native side returned: {value}",
  "demo.empty": "The native side returned nothing.",

  "runtime.label": "Runtime",
  "runtime.version": "Version",
  "runtime.platform": "System",
  "runtime.architecture": "Architecture",
  "runtime.updates": "Updates",
  "runtime.updatesEnabled": "On",
  "runtime.updatesUnconfigured": "Not set up",
  "runtime.updatesDesktopOnly": "Desktop only",

  "storage.label": "Local data",
  "storage.title": "Settings file",
  "storage.automaticUpdates": "Download updates automatically",

  "update.checkNow": "Check for updates",
  "update.available": "Version {version} is available.",
  "update.download": "Download",
  "update.checking": "Checking for updates…",
  "update.downloading": "Downloading the update…",
  "update.downloadingPercent": "Downloading the update… {percent}%",
  "update.ready": "Version {version} is ready to install.",
  "update.install": "Install",
  "update.installing": "Installing. The application will restart…",
  "update.failed": "Could not update: {message}",

  "update.confirmTitle": "Install the update?",
  "update.confirmBody":
    "{name} will close, install version {version}, and reopen. Save your work first.",
  "update.confirmAccept": "Close and install",
  "update.confirmCancel": "Not now",

  "error.title": "Something went wrong",
  "error.heading": "The interface stopped",
  "error.retry": "Try again",
  "error.reload": "Reload",
} as const;

export type Messages = Record<keyof typeof en, string>;
