# Tech-debt register

Living list. Fixed items stay with a strikethrough date so the history is visible.

## Performance (data loading)
The corpus is 34 MB raw / ~6 MB gzipped across 56 chunks. Loading all of it
per-route was the cause of the "very very slow" report.

- ~~**Home / landing** downloaded all 56 chunks and parsed 34 MB before rendering.~~
  Fixed 2026-07-16: `public/data/timeline-index.json` (lite, ~0.8 MB gzipped) via
  `scripts/build-timeline-index.mjs`, loaded by home + search + filters.
- ~~**/year/[id]** loaded all 56 chunks to show one year.~~ Fixed 2026-07-16:
  `fetchYearFull` fetches only the containing chunk (~0.05 s).
- ~~**/era/[id]** loaded all 56 chunks to show a 10-year slice.~~ Fixed
  2026-07-16: uses the shared lite index (cached with home).
- **/atlas** still loads the full corpus. It plots by coordinate, and the lite
  index drops `coordinates_approx`, so it needs either the full data or a new
  coords-only index (`{year, coordinates, category}`). Heavy globe view, opt-in
  via nav. FIX: build a coords index if atlas load time becomes a complaint.
- **/stratum** loads the full corpus on purpose: its detail panel needs
  `era_context` + per-source provenance, which the lite index drops. Secondary
  nav-click view; acceptable. FIX (optional): lite index for the density
  overview + lazy full-year fetch for the selected-year panel.
- **Icelandic locale** (`fetchAllYearsForLocale`) is still a full-corpus load;
  if the `is` timeline ships, it needs its own lite index.

## Deployment / migration
- **opengraph-image.tsx** uses `runtime = "edge"` + `ImageResponse`. This emits
  a build warning ("edge runtime disables static generation") AND blocks
  `output: 'export'`. To move off Vercel to a static host (Cloudflare Pages /
  edge), convert this to a static OG PNG (or drop it).
- **/year/[id]** and **/era/[id]** are `"use client"` dynamic routes. For static
  export they need a server wrapper exporting `generateStaticParams` (5,226 year
  params + the era ids) with the client logic moved to a child component.
- No `vercel.json` / no `.vercel` link: deploy is via Vercel's GitHub
  integration. Moving hosts means either a Cloudflare Pages token
  (`Account > Cloudflare Pages > Edit`, currently missing from the Sumarhus-agent
  token) or a Docker/`next start` deploy on the hcloud edge.

## Next task (separate)
- UX/UI upgrade driven by `docs/ux-audit-2026-07-16.md` (reading-first layout,
  distinct cultural-artifact styling, thematic threads, vertical minimap, atlas
  clustering, era deep-dive pages).
