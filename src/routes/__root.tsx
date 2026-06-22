import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CookieConsentBanner } from "../components/CookieConsentBanner";
import { ConsentScripts } from "../components/ConsentScripts";
import { useCartSync } from "../hooks/useCartSync";
import "../lib/i18n";

function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("notFound.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("notFound.description")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("common.goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { t } = useTranslation();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{t("error.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("error.description")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("common.tryAgain")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("common.goHome")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0c121b" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Protokół Po Przeszczepie" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "google-site-verification", content: "faPtW_FvSsiPhsR5PMFM65mR80STVixgk2FP1mvrEWk" },
      { name: "google-site-verification", content: "rUTghGSQHX0OblD3cFnCAGx7rpIBr4nNmxJ-UtDcn4M" },
      { title: "Protokół Po Przeszczepie" },
      { property: "og:title", content: "Protokół Po Przeszczepie" },
      { name: "twitter:title", content: "Protokół Po Przeszczepie" },
      { name: "description", content: "Zintegrowany protokół po przeszczepie włosów DHI: ochrona ex vivo, fotobiomodulacja, HBOT i LADD. Zwiększ przeżywalność graftów dzięki metodom EBM." },
      { property: "og:description", content: "Zintegrowany protokół po przeszczepie włosów DHI: ochrona ex vivo, fotobiomodulacja, HBOT i LADD. Zwiększ przeżywalność graftów dzięki metodom EBM." },
      { name: "twitter:description", content: "Zintegrowany protokół po przeszczepie włosów DHI: ochrona ex vivo, fotobiomodulacja, HBOT i LADD. Zwiększ przeżywalność graftów dzięki metodom EBM." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b0767879-99bc-42ad-a5ec-33455eafd7bf/id-preview-585ddfb2--c7e70e03-3f90-4937-861a-ddfdd71d13d5.lovable.app-1781824615484.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b0767879-99bc-42ad-a5ec-33455eafd7bf/id-preview-585ddfb2--c7e70e03-3f90-4937-861a-ddfdd71d13d5.lovable.app-1781824615484.png" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-192x192.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": "https://graftgen.com/#organization",
          name: "Graftgen.com",
          legalName: "Medical Lasers and STEM Cells Solutions Sp. z o.o.",
          url: "https://graftgen.com",
          logo: "https://graftgen.com/icon-512x512.png",
          description:
            "Zintegrowany protokół pozabiegowy po przeszczepie włosów DHI: PBM, HBOT, LADD i zarządzanie mikrobiomem.",
          address: {
            "@type": "PostalAddress",
            streetAddress: "ul. Kard. Bolesława Kominka 44",
            postalCode: "44-217",
            addressLocality: "Rybnik",
            addressCountry: "PL",
          },
          identifier: [
            { "@type": "PropertyValue", propertyID: "KRS", value: "0000791172" },
            { "@type": "PropertyValue", propertyID: "NIP", value: "6423218241" },
            { "@type": "PropertyValue", propertyID: "REGON", value: "383695904" },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": "https://graftgen.com/#website",
          name: "Graftgen.com",
          url: "https://graftgen.com",
          inLanguage: "pl-PL",
          publisher: { "@id": "https://graftgen.com/#organization" },
        }),
      },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function BackButton() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();
  if (pathname === "/") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:left-4 sm:top-4 sm:bottom-auto sm:right-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 rounded-full bg-[#0c121b]/80 px-2.5 py-2 text-xs font-medium text-[#c8b06c] backdrop-blur-sm ring-1 ring-[#c8b06c]/20 transition-all hover:bg-[#0c121b] hover:ring-[#c8b06c]/40 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        <span className="hidden sm:inline">{t("common.back")}</span>
      </Link>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <CartSyncBridge />
      <WebVitalsBridge />
      <BackButton />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <CookieConsentBanner />
      <ConsentScripts />
    </QueryClientProvider>
  );
}

function CartSyncBridge() {
  useCartSync();
  return null;
}

function WebVitalsBridge() {
  useEffect(() => {
    void import("../lib/web-vitals").then((m) => m.initWebVitals());
  }, []);
  return null;
}
