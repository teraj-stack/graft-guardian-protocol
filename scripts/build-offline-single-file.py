#!/usr/bin/env python3
"""
Buduje CAŁĄ stronę jako JEDEN plik HTML do użytku offline (file://).

- odwiedza publiczne trasy w uruchomionym dev-serverze,
- przewija stronę, aby domontować sekcje lazy-loaded,
- inline'uje CSS, obrazy i czcionki jako data: URI,
- usuwa skrypty (statyczny snapshot) i dodaje własną nawigację między stronami.

Użycie:  python3 scripts/build-offline-single-file.py [--base http://localhost:8080] [--out public/graftgen-offline.html]
"""

import argparse
import asyncio
import base64
import mimetypes
import re
from pathlib import Path
from urllib.parse import urljoin, urldefrag

from playwright.async_api import async_playwright

ROUTES = [
    ("/", "Strona główna"),
    ("/sklep", "Sklep"),
    ("/koszt-przeszczepu-wlosow", "Koszt przeszczepu"),
    ("/przypomnienia", "Przypomnienia"),
    ("/raport", "Raport"),
    ("/panel", "Panel pacjenta"),
    ("/prywatnosc", "Prywatność"),
    ("/cookies", "Cookies"),
]

MAX_ASSET_BYTES = 3_000_000  # pomijamy bardzo duże pliki (np. wideo)


async def fetch_bytes(page, url):
    try:
        res = await page.request.get(url, timeout=30000)
        if not res.ok:
            return None, None
        body = await res.body()
        ctype = (res.headers.get("content-type") or "").split(";")[0].strip()
        return body, ctype
    except Exception:
        return None, None


def data_uri(body, ctype, url):
    if not ctype:
        ctype = mimetypes.guess_type(url)[0] or "application/octet-stream"
    return f"data:{ctype};base64,{base64.b64encode(body).decode()}"


async def inline_css(page, css_text, css_url, cache):
    """Inline url(...) wewnątrz CSS + @import."""
    async def replace_imports(text):
        out = text
        for m in list(re.finditer(r'@import\s+(?:url\()?["\']?([^"\')]+)["\']?\)?[^;]*;', text)):
            href = urljoin(css_url, m.group(1))
            body, ctype = await fetch_bytes(page, href)
            if body:
                sub = await inline_css(page, body.decode("utf-8", "ignore"), href, cache)
                out = out.replace(m.group(0), sub)
            else:
                out = out.replace(m.group(0), "")
        return out

    css_text = await replace_imports(css_text)

    urls = set(re.findall(r'url\(\s*["\']?([^"\')]+)["\']?\s*\)', css_text))
    for u in urls:
        if u.startswith("data:") or u.startswith("#"):
            continue
        abs_u = urljoin(css_url, u)
        if abs_u in cache:
            repl = cache[abs_u]
        else:
            body, ctype = await fetch_bytes(page, abs_u)
            if not body or len(body) > MAX_ASSET_BYTES:
                cache[abs_u] = None
                continue
            repl = data_uri(body, ctype, abs_u)
            cache[abs_u] = repl
        if repl:
            css_text = css_text.replace(u, repl)
    return css_text


async def snapshot(page, base, path, cache):
    await page.goto(urljoin(base, path), wait_until="networkidle")
    # domontuj sekcje lazy
    for _ in range(30):
        await page.mouse.wheel(0, 1500)
        await page.wait_for_timeout(120)
    await page.wait_for_timeout(800)
    await page.evaluate("window.scrollTo(0,0)")

    # 1) zbierz i zinline'uj arkusze stylów
    raw_css = await page.evaluate(
        """() => {
            const out = [];
            for (const sheet of Array.from(document.styleSheets)) {
              try {
                const rules = sheet.cssRules;
                if (!rules) continue;
                out.push(Array.from(rules).map(r => r.cssText).join('\\n'));
              } catch (e) { /* cross-origin */ }
            }
            return out.join('\\n');
        }"""
    )
    css_parts = [await inline_css(page, raw_css, urljoin(base, path), cache)]


    # 2) obrazy -> data URI
    img_urls = await page.evaluate(
        """() => {
            const out = new Set();
            document.querySelectorAll('img').forEach(i => { if (i.currentSrc) out.add(i.currentSrc); if (i.src) out.add(i.src); });
            document.querySelectorAll('*').forEach(el => {
              const bg = getComputedStyle(el).backgroundImage;
              if (bg && bg !== 'none') for (const m of bg.matchAll(/url\\(["']?([^"')]+)["']?\\)/g)) out.add(m[1]);
            });
            return Array.from(out);
        }"""
    )
    mapping = {}
    for u in img_urls:
        if u.startswith("data:"):
            continue
        if u in cache:
            if cache[u]:
                mapping[u] = cache[u]
            continue
        body, ctype = await fetch_bytes(page, u)
        if not body or len(body) > MAX_ASSET_BYTES:
            cache[u] = None
            continue
        cache[u] = data_uri(body, ctype, u)
        mapping[u] = cache[u]

    html_body = await page.evaluate(
        """(mapping) => {
            const doc = document.body.cloneNode(true);
            doc.querySelectorAll('script, noscript').forEach(n => n.remove());
            doc.querySelectorAll('img').forEach(img => {
              const s = img.currentSrc || img.src;
              if (mapping[s]) img.setAttribute('src', mapping[s]);
              img.removeAttribute('srcset');
              img.setAttribute('loading', 'eager');
            });
            doc.querySelectorAll('video').forEach(v => v.remove());
            doc.querySelectorAll('[style]').forEach(el => {
              let st = el.getAttribute('style');
              for (const [k, v] of Object.entries(mapping)) if (st.includes(k)) st = st.split(k).join(v);
              el.setAttribute('style', st);
            });
            return doc.innerHTML;
        }""",
        mapping,
    )
    title = await page.title()
    return title, "\n".join(css_parts), html_body


def rewrite_links(html, known_paths):
    """Zamień linki wewnętrzne na kotwice do sekcji w pliku offline."""
    def sub(m):
        href = m.group(1)
        clean = urldefrag(href)[0]
        clean = re.sub(r"^https?://[^/]+", "", clean)
        if clean in known_paths:
            return f'href="#page-{known_paths[clean]}"'
        if clean.startswith("/"):
            return 'href="#" data-offline-disabled="1"'
        return m.group(0)

    return re.sub(r'href="([^"]*)"', sub, html)


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:8080")
    ap.add_argument("--out", default="public/graftgen-offline.html")
    args = ap.parse_args()

    ids = {path: re.sub(r"[^a-z0-9]+", "-", (path.strip("/") or "home")) for path, _ in ROUTES}

    cache = {}
    pages = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await ctx.new_page()
        for path, label in ROUTES:
            print("snapshot:", path, flush=True)
            try:
                title, css, body = await snapshot(page, args.base, path, cache)
            except Exception as e:  # noqa: BLE001
                print("  pominięto:", e, flush=True)
                continue
            pages.append({"path": path, "label": label, "title": title, "css": css, "body": body})
        await browser.close()

    all_css = "\n".join(dict.fromkeys(p["css"] for p in pages))
    nav = "".join(
        f'<a href="#page-{ids[p["path"]]}" class="offline-nav-link">{p["label"]}</a>' for p in pages
    )
    sections = []
    for p in pages:
        body = rewrite_links(p["body"], ids)
        sections.append(
            f'<section id="page-{ids[p["path"]]}" class="offline-page" data-label="{p["label"]}">{body}</section>'
        )

    shell = f"""<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Graftgen.com — wersja offline</title>
<style>{all_css}</style>
<style>
  .offline-nav {{ position: sticky; top: 0; z-index: 99999; display: flex; flex-wrap: wrap; gap: .5rem;
    padding: .6rem .9rem; background: #0c121b; border-bottom: 1px solid rgba(200,176,108,.25); }}
  .offline-nav-link {{ color: #c8b06c; font: 500 13px/1.2 Inter, system-ui, sans-serif;
    text-decoration: none; padding: .4rem .7rem; border: 1px solid rgba(200,176,108,.3); border-radius: 999px; }}
  .offline-nav-link:hover {{ background: rgba(200,176,108,.12); }}
  .offline-page {{ display: none; }}
  .offline-page:target {{ display: block; }}
  body:not(:has(.offline-page:target)) .offline-page:first-of-type {{ display: block; }}
  [data-offline-disabled] {{ pointer-events: none; opacity: .7; }}
</style>
</head>
<body>
<nav class="offline-nav" aria-label="Nawigacja offline">{nav}</nav>
{''.join(sections)}
</body>
</html>
"""
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(shell, encoding="utf-8")
    print(f"OK: {out} ({out.stat().st_size/1_048_576:.1f} MB, stron: {len(pages)})")


asyncio.run(main())
