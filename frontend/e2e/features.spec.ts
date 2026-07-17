/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-17
 *
 * Signature-feature regression tests: the reading-first folio, distinct music
 * styling, follow-the-thread navigation (cross-year AND same-year — the case a
 * naive test misses), and expand-all. These lock the UX audit's core wins.
 */
import { test, expect } from "@playwright/test";

test("folio is reading-first: the narrative is visible without expanding", async ({
  page,
}) => {
  await page.goto("/year/1610", { waitUntil: "networkidle" });
  const desc = page.locator(".notebook-folio-entry-desc").first();
  await expect(desc).toBeVisible();
  expect((await desc.textContent())!.trim().length).toBeGreaterThan(20);
  // Sources sit behind an explicit control, not shown by default.
  await expect(page.locator(".notebook-folio-entry-expand")).toHaveCount(0);
});

test("music entries are distinctly styled and carry a thread", async ({ page }) => {
  await page.goto("/year/1610", { waitUntil: "networkidle" });
  const musical = page.locator('.notebook-folio-entry[data-cat="musical"]').first();
  await expect(musical).toBeVisible();
  await expect(musical.locator(".notebook-folio-thread")).toBeVisible();
});

test("thread cross-year hop lands on the exact work and focuses it", async ({
  page,
}) => {
  await page.goto("/year/1610", { waitUntil: "networkidle" });
  await page.locator(".notebook-folio-thread-link.next").first().click();
  await page.waitForURL(/#music-/);
  const id = new URL(page.url()).hash.slice(1);
  await page.waitForTimeout(1000);
  const res = await page.evaluate((anchor) => {
    const el = document.getElementById(anchor);
    if (!el) return { inView: false, focused: false };
    const b = el.getBoundingClientRect();
    return {
      inView: b.top >= -5 && b.top < window.innerHeight,
      focused: document.activeElement === el,
    };
  }, id);
  expect(res.inView).toBe(true);
  expect(res.focused).toBe(true);
});

test("thread same-year hop scrolls + focuses within the same page", async ({
  page,
}) => {
  // 1791 holds multiple music works, so at least one thread link is same-year.
  await page.goto("/year/1791", { waitUntil: "networkidle" });
  const links = page.locator(
    '.notebook-folio-entry[data-cat="musical"] .notebook-folio-thread-link',
  );
  const n = await links.count();
  let sameYear = -1;
  let targetId = "";
  for (let i = 0; i < n; i++) {
    const href = (await links.nth(i).getAttribute("href")) ?? "";
    if (href.startsWith("/year/1791#")) {
      sameYear = i;
      targetId = href.split("#")[1];
      break;
    }
  }
  expect(sameYear, "a same-year thread link should exist on 1791").toBeGreaterThanOrEqual(0);
  await links.nth(sameYear).click();
  await page.waitForTimeout(1000);
  const res = await page.evaluate((anchor) => {
    const el = document.getElementById(anchor);
    if (!el) return { inView: false, focused: false, hash: location.hash };
    const b = el.getBoundingClientRect();
    return {
      inView: b.top >= -5 && b.top < window.innerHeight,
      focused: document.activeElement === el,
      hash: location.hash,
    };
  }, targetId);
  expect(res.hash).toBe(`#${targetId}`);
  expect(res.inView).toBe(true);
  expect(res.focused).toBe(true);
});

test("expand-all opens and collapses every source panel", async ({ page }) => {
  await page.goto("/year/1610", { waitUntil: "networkidle" });
  const btn = page.locator(".notebook-folio-expand-all");
  await expect(btn).toBeVisible();
  const entries = await page.locator(".notebook-folio-entry").count();
  await btn.click();
  await expect(page.locator(".notebook-folio-entry-expand")).toHaveCount(entries);
  await expect(btn).toHaveText(/Collapse all/);
  await btn.click();
  await expect(page.locator(".notebook-folio-entry-expand")).toHaveCount(0);
  await expect(btn).toHaveText(/Expand all/);
});

test("era ribbon: proportional segments filter the timeline", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const ribbon = page.locator(".era-ribbon");
  await expect(ribbon).toBeVisible();
  const segs = ribbon.locator(".era-ribbon-seg");
  await expect(segs).toHaveCount(10);
  // Ancient bands are wider than recent ones (width follows time span).
  const bronze = await segs.last().boundingBox();
  const modern = await segs.first().boundingBox();
  expect(bronze!.width).toBeGreaterThan(modern!.width);
  // Clicking a segment activates it (aria-pressed) and updates the caption.
  const classical = page.locator('.era-ribbon-seg[aria-label*="Classical"]');
  await classical.click();
  await expect(classical).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".era-ribbon-caption-name")).toContainText(/Classical/i);
  // Clicking the active band again clears the filter.
  await classical.click();
  await expect(classical).toHaveAttribute("aria-pressed", "false");
});

test("discoverability: sitemap, robots, and OG image are served", async ({
  request,
}) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain("timeline.sumarhus.com");
  expect(xml).not.toContain("vercel.app");
  expect((xml.match(/<url>/g) ?? []).length).toBeGreaterThan(5000);

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Sitemap: https://timeline.sumarhus.com/sitemap.xml");

  const og = await request.get("/opengraph-image");
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toContain("image/png");
});

test("a scholarly era deep-dive page renders", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/era/era-01", { waitUntil: "networkidle" });
  // Real era, not the "Era not found" / "Unregistered" fallback: assert on the
  // heading CONTENT, not merely that an h1 exists.
  const h1 = page.locator("h1").first();
  await expect(h1).toBeVisible();
  const heading = (await h1.textContent())?.trim() ?? "";
  expect(heading.length).toBeGreaterThan(2);
  expect(heading).not.toMatch(/not found|unregistered/i);
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});
