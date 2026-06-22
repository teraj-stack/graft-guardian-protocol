import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import mscLogo from "@/assets/msc-logo.jpeg.asset.json";
import bujokLogo from "@/assets/bujok-medical.jpg.asset.json";
import mabelLogo from "@/assets/mabel-hair.png.asset.json";
import graftgenLogo from "@/assets/graftgen-logo.jpg.asset.json";
import drBujok from "@/assets/dr-bujok.jpg.asset.json";

import laddVideo from "@/assets/ladd.mp4.asset.json";
import laddPoster from "@/assets/ladd-poster.jpg";
import { CartDrawer } from "@/components/CartDrawer";
import { LazyMount } from "@/components/LazyMount";
import { Section, SectionHeader, Para, Card, Mech } from "@/components/section-primitives";
import {
  MicrobiomeSkeleton,
  TimelineSkeleton,
  JourneySkeleton,
  DayZeroToThreeSkeleton,
  EvidenceBasementSkeleton,
  PricingSkeleton,
  FAQSkeleton,
  CTASkeleton,
  ContactSkeleton,
} from "@/components/section-skeletons";
import { FAQ } from "@/lib/faq-data";

/* ---------- Code-split heavy below-the-fold sections ----------
   Each lazy() resolves to a separate chunk that is fetched only when
   the corresponding LazyMount intersects the viewport. */
const Microbiome = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.Microbiome })),
);
const Timeline = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.Timeline })),
);
const InteractiveSchedule = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.InteractiveSchedule })),
);

const Journey = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.Journey })),
);
const EvidenceBasement = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.EvidenceBasement })),
);
const Pricing = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.Pricing })),
);
const FAQSection = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.FAQSection })),
);
const EbookLeadMagnet = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.EbookLeadMagnet })),
);
const DayZeroToThree = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.DayZeroToThree })),
);
const CTA = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.CTA })),
);
const RisksAndContraindications = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.RisksAndContraindications })),
);
const Contact = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.Contact })),
);

const TITLE = "Protokół po przeszczepie DHI — PBM, HBOT, LADD";
const DESCRIPTION =
  "Zintegrowany protokół po przeszczepie włosów DHI: ochrona ex vivo, fotobiomodulacja, HBOT i LADD. Zwiększ przeżywalność graftów dzięki metodom EBM.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "https://graftgen.com/" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "https://graftgen.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: TITLE,
          description: DESCRIPTION,
          inLanguage: "pl",
          about: {
            "@type": "MedicalProcedure",
            name: "Protokół pozabiegowy po przeszczepie włosów metodą DHI",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: Index,
});

// heroFaq content is sourced from i18n (heroFaq.items) — see src/locales/*.json


function Index() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Nav />
      <main className="relative z-10">
        <Hero />
        <HeroFAQ />
        <Creator />
        <CreatorReviews />
        <LazyMount minHeight={900} fallback={<DayZeroToThreeSkeleton />}><DayZeroToThree /></LazyMount>
        <Why />
        <ExVivo />
        <PBM />
        <HBOT />
        <LADD />
        <LazyMount minHeight={900} fallback={<MicrobiomeSkeleton />}><Microbiome /></LazyMount>
        <LazyMount minHeight={1300} fallback={<TimelineSkeleton />}><Timeline /></LazyMount>
        <LazyMount minHeight={900} fallback={<div style={{ minHeight: 900 }} />}><InteractiveSchedule /></LazyMount>

        <LazyMount minHeight={780} fallback={<JourneySkeleton />}><Journey /></LazyMount>
        <LazyMount minHeight={2100} fallback={<EvidenceBasementSkeleton />}><EvidenceBasement /></LazyMount>
        <LazyMount minHeight={1000} fallback={<PricingSkeleton />}><Pricing /></LazyMount>
        <LazyMount minHeight={1200} fallback={<FAQSkeleton />}><FAQSection /></LazyMount>
        <LazyMount minHeight={900} fallback={<div style={{ minHeight: 900 }} />}><RisksAndContraindications /></LazyMount>
        <LazyMount minHeight={620} fallback={<div style={{ minHeight: 620 }} />}><EbookLeadMagnet /></LazyMount>
        <LazyMount minHeight={520} fallback={<CTASkeleton />}><CTA /></LazyMount>
        <LazyMount minHeight={1080} fallback={<ContactSkeleton />}><Contact /></LazyMount>
      </main>
      <Footer />
    </div>
  );
}

/* ---------- Nav ---------- */

function Nav() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const navLinks = [
    { href: "#ex-vivo", label: t("nav.exVivo") },
    { href: "#pbm", label: t("nav.pbm") },
    { href: "#hbot", label: t("nav.hbot") },
    { href: "#ladd", label: t("nav.ladd") },
    { href: "#protokol", label: t("nav.protocol14") },
    { to: "/sklep" as const, label: t("nav.shop") },
    { to: "/panel" as const, label: t("nav.panel") },
    { to: "/przypomnienia" as const, label: t("nav.reminders") },
    { href: "#faq", label: t("nav.faq") },
    { href: "#kontakt", label: t("nav.contact") },
  ];

  return (
    <header className="relative z-20 border-b border-border/60">
      <div className="mx-auto flex h-20 md:h-24 max-w-6xl items-stretch justify-between px-6">
        <a href="#" className="flex items-stretch py-1.5" aria-label="Graftgen.com">
          <span
            className="block h-full overflow-hidden rounded-lg bg-background"
            style={{ aspectRatio: "414 / 430", width: "auto" }}
          >
            <img
              src={graftgenLogo.url}
              alt="Graftgen.com"
              width={414}
              height={430}
              decoding="async"
              fetchPriority="high"
              className="block h-full w-auto"
            />
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {navLinks.map((l) =>
            "to" in l ? (
              <Link key={l.to} to={l.to} className="hover:text-foreground">{l.label}</Link>
            ) : (
              <a key={l.href} href={l.href} className="hover:text-foreground">{l.label}</a>
            )
          )}
        </nav>

        <div className="flex items-center gap-3 self-center">
          <LanguageSwitcher />
          <CartDrawer />
          <a
            href="#konsultacja"
            className="hidden md:inline-flex items-center rounded-sm border border-foreground/80 bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
          >
            {t("nav.bookConsult")}
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border/60 text-foreground md:hidden"
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={open}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {open ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background px-6 py-4 md:hidden">
          <div className="mb-4 flex justify-center">
            <img
              src={graftgenLogo.url}
              alt="Graftgen.com"
              width={414}
              height={430}
              decoding="async"
              className="h-[73px] w-auto"
            />
          </div>
          <nav className="flex flex-col gap-4 text-sm text-muted-foreground">
            {navLinks.map((l) =>
              "to" in l ? (
                <Link key={l.to} to={l.to} className="hover:text-foreground" onClick={() => setOpen(false)}>{l.label}</Link>
              ) : (
                <a key={l.href} href={l.href} className="hover:text-foreground" onClick={() => setOpen(false)}>{l.label}</a>
              )
            )}
            <a
              href="#konsultacja"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-sm bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:bg-foreground/90"
            >
              {t("nav.bookConsult")}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ---------- Hero FAQ ---------- */

function HeroFAQ() {
  const { t } = useTranslation();
  const items = t("heroFaq.items", { returnObjects: true, defaultValue: [] }) as Array<{ q: string; a: string }>;
  const list = Array.isArray(items) ? items : [];
  return (
    <section id="hero-faq" className="border-b border-border/60">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <p className="mb-6 text-xs uppercase tracking-[0.25em] text-accent">
          {t("heroFaq.eyebrow")}
        </p>
        <h2 className="font-display text-3xl leading-[1.05] md:text-4xl">
          {t("heroFaq.title")}
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {list.map((item) => (
            <div key={item.q} className="border-l-2 border-accent pl-5">
              <h3 className="text-base font-medium leading-snug">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-12 md:py-28">
        <div className="md:col-span-8">
          <p className="mb-6 text-xs uppercase tracking-[0.25em] text-accent">
            {t("hero.kicker")}
          </p>
          <h1 className="font-display text-4xl leading-[1.02] break-words sm:text-5xl md:text-7xl">
            <Trans
              i18nKey="hero.title"
              components={{ em: <em className="text-accent" /> }}
            />
          </h1>
          <p className="mt-8 max-w-2xl text-base text-muted-foreground md:text-lg">
            {t("hero.lead")}
          </p>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground/70">
            {t("hero.subLead")}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#konsultacja"
              className="inline-flex items-center rounded-sm bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:bg-foreground/90"
            >
              {t("hero.ctaBook")}
            </a>
            <a
              href="#protokol"
              className="inline-flex items-center rounded-sm border border-border px-5 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              {t("hero.ctaTimeline")}
            </a>
          </div>
        </div>
        <aside className="md:col-span-4">
          <div className="rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-editorial)]">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t("hero.statsTitle")}
            </p>
            <dl className="mt-6 space-y-5">
              <Stat k={t("hero.stat1k")} v={t("hero.stat1v")} />
              <Stat k={t("hero.stat2k")} v={t("hero.stat2v")} />
              <Stat k={t("hero.stat3k")} v={t("hero.stat3v")} />
              <Stat k={t("hero.stat4k")} v={t("hero.stat4v")} />
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-l-2 border-accent pl-4">
      <dt className="font-display text-2xl">{k}</dt>
      <dd className="mt-1 text-sm text-muted-foreground">{v}</dd>
    </div>
  );
}

/* ---------- Creator ---------- */

function Creator() {
  const { t } = useTranslation();
  const bullets = t("creator.bullets", { returnObjects: true, defaultValue: [] }) as string[];
  return (
    <section className="border-b border-border/60" aria-labelledby="creator-heading">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="mb-6 text-xs uppercase tracking-[0.25em] text-accent" aria-hidden="true">
          {t("creator.eyebrow")}
        </p>
        <div className="grid items-start gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="overflow-hidden rounded-sm border border-border/60">
              <img
                src={drBujok.url}
                alt={t("creator.imgAlt")}
                width={600}
                height={800}
                decoding="async"
                loading="lazy"
                className="block h-auto w-full object-cover"
              />
            </div>
          </div>
          <div className="md:col-span-8">
            <h2 id="creator-heading" className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-5xl">
              {t("creator.heading")}
            </h2>
            <ul className="mt-8 list-disc space-y-5 pl-6 text-muted-foreground md:text-lg">
              {(Array.isArray(bullets) ? bullets : []).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Creator Reviews ---------- */

function CreatorReviews() {
  return (
    <section className="border-b border-border/60" aria-labelledby="creator-reviews-heading">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid items-start gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <a
              href="https://www.znanylekarz.pl/jan-bujok-2/chirurg-flebolog-proktolog/warszawa"
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-sm border border-border/60 bg-card p-6 transition hover:border-accent/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">ZnanyLekarz.pl</p>
                  <p className="text-xs text-muted-foreground">Profil online</p>
                </div>
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-5xl text-accent">5,0</span>
                <span className="text-sm text-muted-foreground">/ 5</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">316 opinii pacjentów</p>
              <p className="mt-4 text-xs text-accent group-hover:underline">
                Zobacz profil →
              </p>
            </a>
          </div>

          <div className="md:col-span-8">
            <h2 id="creator-reviews-heading" className="font-display text-2xl leading-[1.1] md:text-3xl">
              Opinie pacjentów
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Poniżej znajdują się wypowiedzi osób, które skorzystały z usług dr. Bujoka.
              Kliknij link obok, aby przeczytać wszystkie opinie na ZnanyLekarz.pl.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <blockquote className="rounded-sm border border-border/60 bg-card p-5">
                <div className="flex gap-1 text-accent">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                <p className="mt-3 text-sm italic text-muted-foreground">
                  „Świetny lekarz z zaangażowaniem. Nie pamiętam kiedy ostatnio u takiego byłam. Szczegółowo wyjaśnia problem, tłumaczy dokładnie leczenie i w razie potrzeby pozostaje z pacjentem w kontakcie po wizycie i modyfikuje leczenie, tak żeby było jak najbardziej skuteczne. W końcu śpię spokojnie, a to wszystko zasługa doktora, dziękuję ;)"
                </p>
                <footer className="mt-3 text-xs text-muted-foreground/70">— Agata, 7 stycznia 2026</footer>
              </blockquote>
              <blockquote className="rounded-sm border border-border/60 bg-card p-5">
                <div className="flex gap-1 text-accent">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                <p className="mt-3 text-sm italic text-muted-foreground">
                  „Dr Przeprowadził wywiad i wszystko wyjaśnił. Poświęcił czas pacjentowi bez żadnego pośpiechu. Przedstawił odpowiednie metody leczenia."
                </p>
                <footer className="mt-3 text-xs text-muted-foreground/70">— KK, 25 lutego 2026</footer>
              </blockquote>
              <blockquote className="rounded-sm border border-border/60 bg-card p-5">
                <div className="flex gap-1 text-accent">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                <p className="mt-3 text-sm italic text-muted-foreground">
                  „Pan Doktor rzeczowo wyjaśnia schorzenia, z zaangażowaniem. Pacjent może poczuć się zaopiekowany."
                </p>
                <footer className="mt-3 text-xs text-muted-foreground/70">— Marcin, 3 marca 2026</footer>
              </blockquote>
              <blockquote className="rounded-sm border border-border/60 bg-card p-5">
                <div className="flex gap-1 text-accent">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                <p className="mt-3 text-sm italic text-muted-foreground">
                  „Profesjonalizm i dociekliwość. Dokładny wywiad, życzliwe wyjaśnianie pacjentowi możliwości leczenia."
                </p>
                <footer className="mt-3 text-xs text-muted-foreground/70">— Paweł Olejnik, 17 lutego 2026</footer>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Why ---------- */

function Why() {
  const { t } = useTranslation();
  const raw = t("clinical.why.paragraphs", { returnObjects: true, defaultValue: [] });
  const paragraphs = (Array.isArray(raw) ? raw : []) as string[];

  return (
    <Section id="dlaczego" eyebrow={t("clinical.why.eyebrow")}>
      <SectionHeader title={t("clinical.why.title")} />
      <div className="grid gap-8 md:grid-cols-3">
        {paragraphs.map((p, i) => (
          <Para key={i}>{p}</Para>
        ))}
      </div>
    </Section>
  );
}

/* ---------- Ex Vivo ---------- */

function ExVivo() {
  const { t } = useTranslation();
  return (
    <Section id="ex-vivo" eyebrow={t("clinical.exVivo.eyebrow")}>
      <SectionHeader
        title={t("clinical.exVivo.title")}
        lead={t("clinical.exVivo.lead")}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card title={t("clinical.exVivo.card1.title")} badge={t("clinical.exVivo.card1.badge")}>
          <p>{t("clinical.exVivo.card1.body")}</p>
          <Mech>{t("clinical.exVivo.card1.mech")}</Mech>
        </Card>
        <Card title={t("clinical.exVivo.card2.title")} badge={t("clinical.exVivo.card2.badge")}>
          <p>{t("clinical.exVivo.card2.body")}</p>
          <Mech>{t("clinical.exVivo.card2.mech")}</Mech>
        </Card>
      </div>
    </Section>
  );
}

/* ---------- PBM ---------- */

function PBM() {
  const { t } = useTranslation();
  const bRaw = t("clinical.pbm.card1.bullets", { returnObjects: true, defaultValue: [] });
  const bullets = (Array.isArray(bRaw) ? bRaw : []) as string[];

  return (
    <Section id="pbm" eyebrow={t("clinical.pbm.eyebrow")}>
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <SectionHeader title={t("clinical.pbm.title")} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title={t("clinical.pbm.card1.title")} badge={t("clinical.pbm.card1.badge")}>
          <ul className="space-y-2 text-sm">
            {bullets.map((b, i) => (
              <li key={i}>• {b}</li>
            ))}
          </ul>
        </Card>
        <Card title={t("clinical.pbm.card2.title")} badge={t("clinical.pbm.card2.badge")}>
          <p>{t("clinical.pbm.card2.body")}</p>
          <Mech>{t("clinical.pbm.card2.mech")}</Mech>
        </Card>
      </div>
    </Section>
  );
}

/* ---------- HBOT ---------- */

function HBOT() {
  const { t } = useTranslation();
  const bRaw = t("clinical.hbot.card1.bullets", { returnObjects: true, defaultValue: [] });
  const bullets = (Array.isArray(bRaw) ? bRaw : []) as string[];

  return (
    <Section id="hbot" eyebrow={t("clinical.hbot.eyebrow")}>
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <SectionHeader
          title={t("clinical.hbot.title")}
          lead={t("clinical.hbot.lead")}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title={t("clinical.hbot.card1.title")} badge={t("clinical.hbot.card1.badge")}>
          <ul className="space-y-2 text-sm">
            {bullets.map((b, i) => (
              <li key={i}>• {b}</li>
            ))}
          </ul>
        </Card>
        <Card title={t("clinical.hbot.card2.title")} badge={t("clinical.hbot.card2.badge")}>
          <p>{t("clinical.hbot.card2.body")}</p>
          <Mech>{t("clinical.hbot.card2.mech")}</Mech>
        </Card>
      </div>
    </Section>
  );
}

/* ---------- LADD ---------- */

function LADD() {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hRaw = t("clinical.ladd.table.header", { returnObjects: true, defaultValue: [] });
  const header = (Array.isArray(hRaw) ? hRaw : []) as string[];
  const rRaw = t("clinical.ladd.table.rows", { returnObjects: true, defaultValue: [] });
  const rows = (Array.isArray(rRaw) ? rRaw : []) as string[][];


  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <Section id="ladd" eyebrow={t("clinical.ladd.eyebrow")}>
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-1 flex-col">
          <SectionHeader
            title={t("clinical.ladd.title")}
            lead={
              <>
                <span dangerouslySetInnerHTML={{ __html: t("clinical.ladd.leadIntro") }} />
                <br />
                -----------------------------------------------------
                <br />
                <span dangerouslySetInnerHTML={{ __html: t("clinical.ladd.leadWarning") }} />
              </>
            }
          />
          <div className="mt-auto grid grid-cols-2 gap-3 pt-8 md:grid-cols-4">
            {[
              { src: mscLogo.url, alt: "MySkinCode MedTech Platform", w: 1920, h: 1920 },
              { src: bujokLogo.url, alt: "Medical Lasers and STEM Cells Solutions", w: 1024, h: 1024 },
              { src: mabelLogo.url, alt: "Mabel Hair Clinic", w: 372, h: 370 },
              { src: graftgenLogo.url, alt: "Graftgen.com — Post-Transplant Care", w: 414, h: 430 },
            ].map((logo) => (
              <div
                key={logo.alt}
                className="flex aspect-square items-center justify-center rounded-sm border border-border/60 bg-card p-3"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.w}
                  height={logo.h}
                  loading="lazy"
                  decoding="async"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
        <video
          ref={videoRef}
          src={laddVideo.url}
          poster={laddPoster}
          muted
          loop
          playsInline
          preload="none"
          className="w-full max-w-xs shrink-0 rounded-sm border border-border/60 shadow-lg md:max-w-sm"
        />
      </div>


      <div className="mt-8 overflow-x-auto rounded-sm border border-border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {header.map((h, i) => (
                <th key={i} className="px-5 py-4 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr]:border-b [&>tr]:border-border [&>tr:last-child]:border-b-0">
            {rows.map((r, i) => (
              <Row key={i} label={r[0]} a={r[1]} b={r[2]} />
            ))}
          </tbody>
        </table>
      </div>

    </Section>
  );
}

function Row({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <tr>
      <td className="px-5 py-4 font-medium text-foreground">{label}</td>
      <td className="px-5 py-4 text-muted-foreground">{a}</td>
      <td className="px-5 py-4 text-muted-foreground">{b}</td>
    </tr>
  );
}


/* ---------- Footer ---------- */

function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="font-display text-2xl">Protokół po przeszczepie</p>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Materiał edukacyjny dla pacjentów po przeszczepie włosów
              metodą DHI. Treści mają charakter informacyjny i nie
              zastępują indywidualnej konsultacji lekarskiej. Decyzje
              terapeutyczne podejmuje lekarz na podstawie pełnego wywiadu
              i badania.
            </p>
          </div>
          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Sekcje
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#ex-vivo" className="hover:text-accent">Faza Ex Vivo</a></li>
              <li><a href="#pbm" className="hover:text-accent">Fotobiomodulacja</a></li>
              <li><a href="#hbot" className="hover:text-accent">HBOT</a></li>
              <li><a href="#ladd" className="hover:text-accent">LADD</a></li>
              <li><a href="#protokol" className="hover:text-accent">Oś czasu 14 dni</a></li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Zastrzeżenia
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>Brak gwarancji wyniku terapii</li>
              <li>Minoksydyl doustny — off-label</li>
              <li>HBOT — wskazanie komercyjne, nierefundowane</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Współtwórcy projektu
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
          <span>© {new Date().getFullYear()} Protokół po przeszczepie. Wszystkie prawa zastrzeżone.</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link to="/prywatnosc" className="hover:text-accent">Polityka prywatności i RODO</Link>
            <Link to="/cookies" className="hover:text-accent">Polityka cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
