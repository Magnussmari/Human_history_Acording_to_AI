/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-17
 *
 * ISC-2 + ISC-3: every route renders with zero console/page errors and no
 * horizontal overflow at phone → desktop widths.
 */
import { test, expect } from "@playwright/test";

// Stable routes. /era is covered in features.spec.ts (needs a discovered id).
const ROUTES = [
  "/",
  "/year/1610",
  "/atlas",
  "/stratum",
  "/methodology",
  "/updates",
  "/music",
];
const WIDTHS = [320, 375, 414, 768, 1440];

for (const route of ROUTES) {
  test(`no console/page errors: ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));
    await page.goto(route, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    expect(errors, `console/page errors on ${route}:\n${errors.join("\n")}`).toEqual([]);
  });

  test(`no horizontal overflow: ${route}`, async ({ page }) => {
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(route, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `overflow on ${route} @ ${w}px`).toBeLessThanOrEqual(1);
    }
  });
}
