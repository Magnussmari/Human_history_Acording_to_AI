/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-17
 *
 * Full sitemap for the corpus: home + the interactive views + every filed year
 * (from the lite timeline index, so no soft-404s) + every scholarly era. Built
 * statically at build time; read from public/data via fs so the 7 MB index is
 * never bundled into the client.
 */
import type { MetadataRoute } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

function readData<T>(rel: string): T {
  return JSON.parse(
    readFileSync(join(process.cwd(), "public", "data", rel), "utf8"),
  ) as T;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/atlas`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/stratum`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/music`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/methodology`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/methodology/scite-mcp`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/updates`, changeFrequency: "weekly", priority: 0.6 },
  ];

  const years = readData<{ year: number }[]>("timeline-index.json").map(
    (y): MetadataRoute.Sitemap[number] => ({
      url: `${base}/year/${y.year}`,
      changeFrequency: "yearly",
      priority: 0.3,
    }),
  );

  const eras = readData<{ registry: { id: string }[] }>(
    "eras/index.json",
  ).registry.map(
    (e): MetadataRoute.Sitemap[number] => ({
      url: `${base}/era/${e.id}`,
      changeFrequency: "monthly",
      priority: 0.5,
    }),
  );

  return [...staticRoutes, ...years, ...eras];
}
