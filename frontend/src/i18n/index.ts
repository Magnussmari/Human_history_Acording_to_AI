/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 *
 * Locale infrastructure scaffold. Route restructure (`app/[lang]/...`)
 * is intentionally deferred — this file only sets up the dictionary
 * loader, locale typeguard, and locale-aware data URLs so the rest of
 * the codebase can read locale-aware content without yet committing to
 * the route move.
 */

import enDict from "./dictionaries/en.json";
import isDict from "./dictionaries/is.json";

export const SUPPORTED_LOCALES = ["en", "is"] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];
export const DEFAULT_LOCALE: Locale = "en";

const dictionaries = {
  en: enDict,
  is: isDict,
} as const;

export type Dictionary = typeof enDict;

export function hasLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function localeDataPath(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "/data" : `/data/${locale}`;
}
