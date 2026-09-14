// A deliberately small translation layer.
//
// A desktop application needs its interface in the user's language, but it does
// not need a translation framework: the whole mechanism is a lookup and a
// placeholder substitution. Adding a language means adding one file and one
// entry to LOCALES.

import { en, type Messages } from "../locales/en";
import { zhCN } from "../locales/zh-CN";

export const LOCALES = {
  en,
  "zh-CN": zhCN,
} satisfies Record<string, Messages>;

export type Locale = keyof typeof LOCALES;
/** "system" follows the operating system; anything else pins a language. */
export type LanguagePreference = "system" | Locale;

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  "zh-CN": "中文",
};

const FALLBACK: Locale = "en";

/**
 * Maps a browser language tag onto a locale we ship.
 *
 * Tags are matched from most to least specific, so `zh-Hans-CN` and `zh` both
 * reach `zh-CN` without listing every variant.
 */
export function matchLocale(tags: readonly string[]): Locale {
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    for (const locale of Object.keys(LOCALES) as Locale[]) {
      if (lower === locale.toLowerCase()) {
        return locale;
      }
    }
    const base = lower.split("-")[0];
    for (const locale of Object.keys(LOCALES) as Locale[]) {
      if (locale.toLowerCase().split("-")[0] === base) {
        return locale;
      }
    }
  }
  return FALLBACK;
}

export function resolveLocale(preference: LanguagePreference): Locale {
  if (preference !== "system") {
    return preference;
  }
  const tags =
    typeof navigator === "undefined"
      ? []
      : [...(navigator.languages ?? []), navigator.language].filter(Boolean);
  return matchLocale(tags);
}

export type Translate = (
  key: keyof Messages,
  values?: Record<string, string | number>,
) => string;

export function translator(locale: Locale): Translate {
  const messages = LOCALES[locale];
  return (key, values) => {
    const template = messages[key] ?? en[key] ?? key;
    if (!values) {
      return template;
    }
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in values ? String(values[name]) : match,
    );
  };
}
