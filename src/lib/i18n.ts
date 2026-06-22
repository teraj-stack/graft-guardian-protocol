import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import pl from "@/locales/pl.json";
import en from "@/locales/en.json";
import tr from "@/locales/tr.json";

export const SUPPORTED_LOCALES = ["pl", "en", "tr"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  pl: "Polski",
  en: "English",
  tr: "Türkçe",
};

const STORAGE_KEY = "graftgen.lang";

if (!i18n.isInitialized) {
  // Synchronous init so SSR renders translated strings (no raw keys, no
  // hydration mismatches). initImmediate:false is the documented switch for this.
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        pl: { translation: pl },
        en: { translation: en },
        tr: { translation: tr },
      },
      lng: "pl", // stable for SSR; client switches via LanguageSwitcher useEffect
      fallbackLng: "en", // patients without TR/PL get English, not Polish
      supportedLngs: [...SUPPORTED_LOCALES],
      nonExplicitSupportedLngs: true,
      load: "languageOnly",
      initAsync: false,
      interpolation: { escapeValue: false },
      returnNull: false,
      returnEmptyString: false,
      react: { useSuspense: false },
    });
}


/** Read persisted/browser language client-side. Runs only after hydration. */
export function getClientLocale(): Locale {
  if (typeof window === "undefined") return "pl";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
      return stored as Locale;
    }
  } catch {
    /* ignore */
  }
  const nav = (navigator.language || "pl").slice(0, 2).toLowerCase();
  return (SUPPORTED_LOCALES as readonly string[]).includes(nav) ? (nav as Locale) : "pl";
}

export function persistLocale(lng: Locale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
}

export default i18n;
