import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LOCALES, getClientLocale, persistLocale, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  // After hydration: adopt the client-detected locale.
  useEffect(() => {
    setMounted(true);
    const detected = getClientLocale();
    if (detected !== i18n.language) {
      void i18n.changeLanguage(detected);
    }
    document.documentElement.lang = detected;
  }, [i18n]);

  const current = (mounted ? (i18n.resolvedLanguage || i18n.language || "pl") : "pl")
    .slice(0, 2) as Locale;

  return (
    <div
      role="group"
      aria-label={t("languageSwitcher.label")}
      className={`inline-flex items-center gap-0.5 rounded-sm border border-border/60 bg-background/60 p-0.5 ${
        compact ? "text-[10px]" : "text-xs"
      }`}
    >
      {SUPPORTED_LOCALES.map((lng) => {
        const active = current === lng;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => {
              persistLocale(lng);
              void i18n.changeLanguage(lng);
              document.documentElement.lang = lng;
            }}
            aria-pressed={active}
            className={`rounded-sm px-2 py-1 font-medium uppercase tracking-wider transition ${
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {lng}
          </button>
        );
      })}
    </div>
  );
}
