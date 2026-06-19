#!/usr/bin/env python3
"""Visual logo regression test.

Verifies branding strategy across desktop and mobile viewports:
- Section #pbm on "/"   -> Graftgen logo present
- Section #hbot on "/"  -> Graftgen logo present
- Section #ladd on "/"  -> MSC logo present (partner tile)
- /sklep product cards  -> HBOT/PBM placeholder = Graftgen, LADD placeholder = MSC
- /product/<handle>     -> same rule per product (when Shopify image missing)

Screenshots are written to ./visual-report/<viewport>/ for artifact upload.
Exits non-zero on any assertion failure.

Usage:
  BASE_URL=http://localhost:8080 python scripts/visual-logo-check.py
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

from playwright.async_api import Page, async_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:8080").rstrip("/")
OUT = Path(os.environ.get("VISUAL_OUT", "visual-report"))
OUT.mkdir(parents=True, exist_ok=True)

VIEWPORTS = {
    "desktop": {"width": 1280, "height": 1800},
    "mobile": {"width": 390, "height": 1800},
}

# Brand mapping: product-title keyword -> expected logo token in src URL
LADD_KEYWORDS = ("ladd", "plazma", "cap", "tulowy")
GRAFTGEN_KEYWORDS = ("hbot", "hiperbaryczna", "pbm", "fototerapia", "lllt")


def classify_logo(src: str) -> str:
    s = (src or "").lower()
    if "msc" in s:
        return "MSC"
    if "graftgen" in s:
        return "Graftgen"
    if s:
        return "Shopify"
    return "none"


def expected_for_title(title: str) -> str:
    t = (title or "").lower()
    if any(k in t for k in LADD_KEYWORDS):
        return "MSC"
    if any(k in t for k in GRAFTGEN_KEYWORDS):
        return "Graftgen"
    return ""  # unknown — skip


async def scroll_full(page: Page) -> None:
    height = await page.evaluate("document.body.scrollHeight")
    for y in range(0, height, 800):
        await page.evaluate(f"window.scrollTo(0,{y})")
        await page.wait_for_timeout(120)
    await page.evaluate("window.scrollTo(0,0)")
    await page.wait_for_timeout(200)


async def run_viewport(vp_name: str, vp: dict, failures: list[str]) -> None:
    vp_dir = OUT / vp_name
    vp_dir.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport=vp)
        page = await ctx.new_page()

        # --- Home: section logos ---
        await page.goto(f"{BASE}/", wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
        await scroll_full(page)

        for sid, expected_logo, alt_match in [
            ("pbm", "Graftgen", "graftgen"),
            ("hbot", "Graftgen", "graftgen"),
            ("ladd", "MSC", "msc"),
        ]:
            section = page.locator(f"#{sid}")
            if await section.count() == 0:
                failures.append(f"[{vp_name}] #{sid} section missing")
                continue
            await section.first.scroll_into_view_if_needed()
            await page.wait_for_timeout(300)
            await section.first.screenshot(path=str(vp_dir / f"home-{sid}.png"))

            imgs = section.locator("img")
            n = await imgs.count()
            found = False
            for i in range(n):
                src = (await imgs.nth(i).get_attribute("src")) or ""
                alt = ((await imgs.nth(i).get_attribute("alt")) or "").lower()
                if alt_match in src.lower() or alt_match in alt:
                    found = True
                    break
            if not found:
                failures.append(
                    f"[{vp_name}] #{sid}: expected {expected_logo} logo not found ({n} imgs scanned)"
                )

        # --- Shop: product card placeholders ---
        await page.goto(f"{BASE}/sklep", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        await scroll_full(page)
        await page.screenshot(path=str(vp_dir / "sklep.png"))

        cards = await page.locator('a[href^="/product/"]').all()
        # Each product appears as image-link + title-link; iterate, prefer image cards.
        seen: dict[str, dict] = {}
        for c in cards:
            href = await c.get_attribute("href") or ""
            text = (await c.inner_text()).strip()
            img = c.locator("img").first
            src = ""
            if await img.count():
                src = (await img.get_attribute("src")) or ""
            entry = seen.setdefault(href, {"title": "", "src": ""})
            if text and not entry["title"]:
                entry["title"] = text
            if src and not entry["src"]:
                entry["src"] = src

        for href, info in seen.items():
            title = info["title"] or href
            expected = expected_for_title(title)
            if not expected:
                continue
            got = classify_logo(info["src"])
            # Only assert when fallback placeholder is used. If Shopify image is
            # present (neither MSC nor Graftgen token in URL), skip — real image wins.
            if got in ("MSC", "Graftgen") and got != expected:
                failures.append(
                    f"[{vp_name}] /sklep card '{title[:40]}' -> got {got}, expected {expected}"
                )

        # --- Product detail pages ---
        for href, info in seen.items():
            title = info["title"]
            expected = expected_for_title(title)
            if not expected:
                continue
            await page.goto(f"{BASE}{href}", wait_until="domcontentloaded")
            await page.wait_for_timeout(1500)
            slug = href.rsplit("/", 1)[-1]
            await page.screenshot(path=str(vp_dir / f"product-{slug}.png"))

            # Find the hero/main product image (first img after h1).
            imgs = await page.locator("img").all()
            chosen_src = ""
            for im in imgs:
                src = (await im.get_attribute("src")) or ""
                # skip header brand logo
                if "graftgen-logo" in src and expected != "Graftgen":
                    continue
                if src:
                    chosen_src = src
                    break
            got = classify_logo(chosen_src)
            if got in ("MSC", "Graftgen") and got != expected:
                failures.append(
                    f"[{vp_name}] /product/{slug} -> got {got}, expected {expected} (src={chosen_src[:80]})"
                )

        await browser.close()


async def main() -> int:
    failures: list[str] = []
    for name, vp in VIEWPORTS.items():
        print(f"\n=== {name} {vp} ===", flush=True)
        await run_viewport(name, vp, failures)

    report = {
        "base": BASE,
        "viewports": list(VIEWPORTS),
        "failures": failures,
        "ok": not failures,
    }
    (OUT / "report.json").write_text(json.dumps(report, indent=2))

    if failures:
        print("\nFAILURES:")
        for f in failures:
            print("  -", f)
        return 1
    print("\nAll logo assertions passed.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
