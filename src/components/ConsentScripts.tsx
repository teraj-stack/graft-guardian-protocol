import { useEffect } from "react";
import { useCookieConsent, type CookieConsent } from "@/lib/cookie-consent";

/**
 * Loads third-party tracking scripts strictly based on user consent.
 * - Scripts are injected only after the matching category is granted.
 * - On consent revocation the script tags are removed and known cookies
 *   set by the vendor are cleared from document.cookie.
 *
 * Currently registered:
 *   - marketing → Meta Pixel (only if VITE_META_PIXEL_ID is set)
 *
 * Analytics has no script registered yet — the gate is in place; add a
 * loader here when a tool (GA4, Plausible, Clarity) is chosen.
 */
export function ConsentScripts() {
  const { consent, hydrated } = useCookieConsent();

  useEffect(() => {
    if (!hydrated) return;
    syncMetaPixel(consent);
    // syncAnalytics(consent); // placeholder — add when an analytics tool is chosen
  }, [consent, hydrated]);

  return null;
}

/* ---------------- Meta Pixel ---------------- */

const META_PIXEL_SCRIPT_ID = "consent-meta-pixel";
const META_PIXEL_NOSCRIPT_ID = "consent-meta-pixel-ns";
const META_PIXEL_COOKIES = ["_fbp", "_fbc"];

function syncMetaPixel(consent: CookieConsent | null) {
  const pixelId = (import.meta as unknown as { env: Record<string, string | undefined> }).env
    .VITE_META_PIXEL_ID;
  const granted = !!consent?.marketing && !!pixelId;

  if (granted) {
    if (document.getElementById(META_PIXEL_SCRIPT_ID)) return;

    const s = document.createElement("script");
    s.id = META_PIXEL_SCRIPT_ID;
    s.async = true;
    s.text = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(s);

    const ns = document.createElement("noscript");
    ns.id = META_PIXEL_NOSCRIPT_ID;
    ns.innerHTML = `<img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />`;
    document.body.appendChild(ns);
    return;
  }

  // Revoked or never granted — remove tags and disable global.
  document.getElementById(META_PIXEL_SCRIPT_ID)?.remove();
  document.getElementById(META_PIXEL_NOSCRIPT_ID)?.remove();
  document
    .querySelectorAll('script[src*="connect.facebook.net/en_US/fbevents.js"]')
    .forEach((n) => n.remove());
  const w = window as unknown as { fbq?: unknown; _fbq?: unknown };
  if (w.fbq) {
    try {
      delete w.fbq;
      delete w._fbq;
    } catch {
      w.fbq = undefined;
      w._fbq = undefined;
    }
  }
  clearCookies(META_PIXEL_COOKIES);
}

/* ---------------- Helpers ---------------- */

function clearCookies(names: string[]) {
  const host = window.location.hostname;
  const domains = new Set<string>([host, "." + host]);
  const parts = host.split(".");
  if (parts.length > 1) domains.add("." + parts.slice(-2).join("."));
  const paths = ["/", window.location.pathname];

  for (const name of names) {
    for (const domain of domains) {
      for (const path of paths) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}`;
      }
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }
}
