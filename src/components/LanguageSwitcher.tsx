import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage || i18n.language || "pl").slice(0, 2) as Locale;

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = current;
    }
  }, [current]);

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
              void i18n.changeLanguage(lng);
              try {
                localStorage.setItem("graftgen.lang", lng);
              } catch {
                /* ignore */
              }
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
