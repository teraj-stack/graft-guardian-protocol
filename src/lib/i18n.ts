import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

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

if (!i18n.isInitialized) {
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        pl: { translation: pl },
        en: { translation: en },
        tr: { translation: tr },
      },
      fallbackLng: "pl",
      supportedLngs: [...SUPPORTED_LOCALES],
      nonExplicitSupportedLngs: true,
      load: "languageOnly",
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator", "htmlTag"],
        caches: ["localStorage"],
        lookupLocalStorage: "graftgen.lang",
      },
      react: { useSuspense: false },
    });
}

export default i18n;
