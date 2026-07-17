# Chronograph — S-tier Ideal State Criteria (ISC)

> The PAI way: capture the ideal state as binary, testable criteria, then
> hill-climb until every gate is green. This is the SSOT for "the UX build is
> S-tier." Started 2026-07-17 under an operator mandate to reach ideal state.

Live target: https://timeline.sumarhus.com (sovereign edge, smarason-edge-hel1).

## Criteria

| # | Criterion | Gate (how we prove it) | Status |
|---|---|---|---|
| ISC-1 | Quality is durable, not a snapshot | Committed Playwright E2E suite + GitHub Actions CI green on push/PR | ☑ suite + CI committed |
| ISC-2 | Zero console errors app-wide | E2E asserts 0 console/page errors on every route | ☑ green |
| ISC-3 | No horizontal overflow at any width | E2E asserts scrollWidth ≤ innerWidth at 320/375/414/768 on every route | ☑ green (fixed stratum/methodology/music/folio/header) |
| ISC-4 | Full keyboard + screen-reader a11y | axe-core: 0 serious/critical app-wide; interactive elements keyboard-reachable & labelled | ☐ |
| ISC-5 | Mobile/tablet has spatial orientation | An era-jump affordance is usable below 1400px (where the minimap is hidden) | ☐ |
| ISC-6 | Discoverable / shareable | sitemap.xml (home + years + eras + static) and robots.txt served; OG image resolves | ☑ sitemap(5255)+robots+OG 200, metadataBase fixed, E2E-covered |
| ISC-7 | Consistent chrome | No sticky-header overlap on desktop; nav coherent at all widths | ☐ |
| ISC-8 | Adversarial sign-off | Fable verdict SHIP on the whole push, no unresolved HIGH/MEDIUM | ☐ |

## Routes in scope
`/` · `/year/[id]` · `/era/[id]` · `/atlas` · `/stratum` · `/methodology` · `/updates` · `/music`

## Log
- 2026-07-17: ISC defined; foundation (E2E + CI) and parallel a11y/responsive/SEO audits kicked off.
- 2026-07-17: E2E suite (smoke + features) committed, green locally; GitHub Actions CI added.
  Suite immediately caught real horizontal overflow on /stratum, /methodology, /music — all fixed
  (ISC-1/2/3 ☑). Three Fable audits landed; findings feed the remaining criteria:
  - a11y (ISC-4): ⌘K overlay not a focus-trapping dialog; atlas canvas keyboard-invisible +
    symbol-only control names; muted-ink contrast <4.5:1 (token-level); cross-year links named by
    raw id; 14 prohibited aria-labels on spans; no skip link; two inputs lack focus rings.
  - responsive (ISC-5/7): atlas globe clipped + HUD offscreen on phones; stratum ribbon axis
    labels overprint (need density thinning); minimap hidden ≤1024 (not just phones) → slim
    era-strip; sticky-header 7.8px overlap confirmed; secondary bar ghosts through (backdrop-filter).
  - SEO (ISC-6): /sitemap.xml + /robots.txt missing; opengraph-image 502 on live; og:url/og:image
    point at the retired vercel domain; per-page metadata generic (generateMetadata lever).
  - Note: scholarly /era pages are EMPTY in this build (Layer 2 evidence not deployed) — the era
    deep-dive criterion is a DATA gap, not a frontend one.
