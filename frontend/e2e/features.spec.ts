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

test("a scholarly era deep-dive page renders from a year folio", async ({ page }) => {
  // The folio's "Scholarly era" card links to /era/<id> when one covers the year.
  await page.goto("/year/1610", { waitUntil: "networkidle" });
  const eraLink = page.locator('a[href^="/era/"]').first();
  const count = await eraLink.count();
  test.skip(count === 0, "no scholarly era covers 1610 in this build");
  await eraLink.click();
  await page.waitForURL(/\/era\//);
  await expect(page.locator("h1")).toBeVisible();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.waitForTimeout(400);
  expect(errors).toEqual([]);
});
