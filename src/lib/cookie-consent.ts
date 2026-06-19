import { useEffect, useState, useCallback } from "react";

export type CookieCategory = "necessary" | "analytics" | "functional" | "marketing";

export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  timestamp: string;
  version: number;
};

export const COOKIE_CONSENT_KEY = "cookie-consent-v1";
export const COOKIE_CONSENT_VERSION = 1;
const EVENT = "cookie-consent-change";

export function readConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(consent: Omit<CookieConsent, "timestamp" | "version" | "necessary">) {
  const full: CookieConsent = {
    necessary: true,
    analytics: consent.analytics,
    functional: consent.functional,
    marketing: consent.marketing,
    timestamp: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
  };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(full));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: full }));
  return full;
}

export function revokeConsent() {
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: null }));
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConsent(readConsent());
    setHydrated(true);
    const handler = () => setConsent(readConsent());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const accept = useCallback(
    (partial: { analytics: boolean; functional: boolean; marketing: boolean }) => {
      const next = writeConsent(partial);
      setConsent(next);
    },
    [],
  );

  const acceptAll = useCallback(
    () => accept({ analytics: true, functional: true, marketing: true }),
    [accept],
  );

  const rejectAll = useCallback(
    () => accept({ analytics: false, functional: false, marketing: false }),
    [accept],
  );

  const revoke = useCallback(() => {
    revokeConsent();
    setConsent(null);
  }, []);

  return { consent, hydrated, accept, acceptAll, rejectAll, revoke };
}
