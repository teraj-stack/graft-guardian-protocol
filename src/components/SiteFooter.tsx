import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import mscLogo from "@/assets/msc-logo.jpeg.asset.json";
import bujokLogo from "@/assets/bujok-medical.jpg.asset.json";
import mabelLogo from "@/assets/mabel-hair.png.asset.json";

/**
 * Globalna stopka strony — i18n (PL/EN/TR).
 * Linki sekcji wskazują na "/#anchor", więc działają zarówno z `/`
 * jak i z dowolnej podstrony.
 */
export function SiteFooter({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const disclaimers = t("footer.disclaimers", {
    returnObjects: true,
    defaultValue: [],
  }) as string[];

  return (
    <footer className={`border-t border-border bg-background ${className}`}>
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="font-display text-2xl">{t("footer.brand")}</p>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              {t("footer.about")}
            </p>
          </div>
          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t("footer.sectionsTitle")}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="/#ex-vivo" className="hover:text-accent">{t("footer.sections.exVivo")}</a></li>
              <li><a href="/#pbm" className="hover:text-accent">{t("footer.sections.pbm")}</a></li>
              <li><a href="/#hbot" className="hover:text-accent">{t("footer.sections.hbot")}</a></li>
              <li><a href="/#ladd" className="hover:text-accent">{t("footer.sections.ladd")}</a></li>
              <li><a href="/#protokol" className="hover:text-accent">{t("footer.sections.timeline")}</a></li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t("footer.disclaimersTitle")}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {Array.isArray(disclaimers) && disclaimers.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {t("footer.partnersTitle")}
          </p>
          <div className="mt-6 grid grid-cols-1 items-center gap-6 sm:grid-cols-3">
            <div className="flex items-center justify-center rounded-md bg-white p-4 h-24">
              <img src={mscLogo.url} alt="MySkinCode — Technical Support MedTech SaaS" width={1920} height={1920} className="max-h-full max-w-full object-contain" loading="lazy" decoding="async" />
            </div>
            <div className="flex items-center justify-center rounded-md bg-black p-4 h-24">
              <img src={bujokLogo.url} alt="Medical Lasers and STEM Cells Solutions" width={1024} height={1024} className="max-h-full max-w-full object-contain" loading="lazy" decoding="async" />
            </div>
            <div className="flex items-center justify-center rounded-md bg-[#3f4a73] p-4 h-24">
              <img src={mabelLogo.url} alt="Mabel Hair — Hair Transplant Clinic" width={372} height={370} className="max-h-full max-w-full object-contain" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-muted-foreground">
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link to="/prywatnosc" className="hover:text-accent">{t("footer.privacy")}</Link>
            <Link to="/cookies" className="hover:text-accent">{t("footer.cookies")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
