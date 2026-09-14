// The single place where the frontend names a Rust command. Keeping the
// signatures here means a renamed command breaks the type check instead of
// failing silently at runtime.

import { invoke, isTauri } from "@tauri-apps/api/core";

import type { LanguagePreference } from "./i18n";

export type AppInfo = {
  name: string;
  version: string;
  platform: string;
  architecture: string;
  configPath: string;
};

export type Theme = "system" | "light" | "dark";

export type Settings = {
  theme: Theme;
  language: LanguagePreference;
  automaticUpdates: boolean;
};

export type UpdateStatus = {
  configured: boolean;
  currentVersion: string;
};

/** False while running `bun run frontend:dev` in a browser. */
export const isDesktop = isTauri();

/** Returns the value the native side produced. Wording belongs to the caller. */
export function normalizeInput(input: string): Promise<string> {
  return invoke<string>("normalize", { input });
}

export function readAppInfo(): Promise<AppInfo> {
  return invoke<AppInfo>("app_info");
}

export function readUpdateStatus(): Promise<UpdateStatus> {
  return invoke<UpdateStatus>("update_status");
}

export function readSettings(): Promise<Settings> {
  return invoke<Settings>("load_settings");
}

export function writeSettings(settings: Settings): Promise<void> {
  return invoke<void>("save_settings", { settings });
}

export function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === "string" ? error : JSON.stringify(error);
}
