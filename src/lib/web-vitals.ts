// Web Vitals (field) collector — sends RUM metrics to /api/public/vitals.
// Runs only in the browser. Uses sendBeacon when available, fallback to fetch keepalive.
import { onCLS, onLCP, onINP, onFCP, onTTFB, type Metric } from "web-vitals";

const ENDPOINT = "/api/public/vitals";
const SESSION_KEY = "gg_vitals_sid";

function sessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "anon";
  }
}

function device(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent;
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

function connection(): string | null {
  const c = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
  return c?.effectiveType ?? null;
}

function send(metric: Metric) {
  const body = JSON.stringify({
    sid: sessionId(),
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navType: metric.navigationType,
    page: location.pathname,
    device: device(),
    connection: connection(),
    ua: navigator.userAgent.slice(0, 255),
  });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    /* fall through */
  }
  void fetch(ENDPOINT, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  }).catch(() => {});
}

let started = false;
export function initWebVitals() {
  if (started || typeof window === "undefined") return;
  started = true;
  onCLS(send);
  onLCP(send);
  onINP(send);
  onFCP(send);
  onTTFB(send);
}
