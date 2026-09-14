import { useCallback, useEffect, useState } from "react";

import {
  isDesktop,
  readSettings,
  writeSettings,
  type Settings,
  type Theme,
} from "../lib/bridge";
import { resolveLocale, translator, type Locale } from "../lib/i18n";

const fallback: Settings = {
  theme: "system",
  language: "system",
  automaticUpdates: true,
};

/**
 * Applies the chosen colour scheme.
 *
 * "system" removes the attribute so the stylesheet's `prefers-color-scheme`
 * rules take over again.
 */
function applyTheme(theme: Theme): void {
  if (theme === "system") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(fallback);
  const [loaded, setLoaded] = useState(!isDesktop);

  useEffect(() => {
    if (!isDesktop) {
      return;
    }
    let active = true;
    readSettings()
      .then((stored) => {
        if (active) {
          setSettings(stored);
        }
      })
      .finally(() => {
        if (active) {
          setLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const locale: Locale = resolveLocale(settings.language);

  // Screen readers and the browser's own text handling rely on this being
  // right, so it follows the resolved locale rather than the preference.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // The interface updates immediately and the file write follows, so a slow
  // disk never makes the controls feel unresponsive.
  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      if (isDesktop) {
        void writeSettings(next).catch((error: unknown) => {
          console.error("Could not persist settings", error);
        });
      }
      return next;
    });
  }, []);

  return { settings, update, loaded, locale, t: translator(locale) };
}
