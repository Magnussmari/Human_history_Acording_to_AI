/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-17
 *
 * ISC-4: axe-core gate — zero serious/critical accessibility violations on
 * every route. Keeps the a11y bar from regressing (contrast, names, roles,
 * landmarks). axe-core is loaded from the CDN at test time.
 */
import { test, expect } from "@playwright/test";

const ROUTES = [
  "/",
  "/year/1610",
  "/era/era-01",
  "/atlas",
  "/stratum",
  "/methodology",
  "/updates",
  "/music",
];

const AXE_CDN = "https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js";

for (const route of ROUTES) {
  test(`no serious/critical a11y violations: ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.addScriptTag({ url: AXE_CDN });
    const violations = await page.evaluate(async () => {
      // @ts-expect-error axe is injected at runtime
      const res = await window.axe.run(document, { resultTypes: ["violations"] });
      return res.violations
        .filter(
          (v: { impact: string }) =>
            v.impact === "serious" || v.impact === "critical",
        )
        .map((v: { id: string; impact: string; nodes: unknown[] }) => ({
          id: v.id,
          impact: v.impact,
          count: v.nodes.length,
        }));
    });
    expect(
      violations,
      `serious/critical a11y violations on ${route}:\n${JSON.stringify(violations, null, 2)}`,
    ).toEqual([]);
  });
}
