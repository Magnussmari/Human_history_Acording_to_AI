/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-17
 *
 * Canonical origin of the sovereign deploy. Single source for metadataBase,
 * sitemap, and robots. Overridable via NEXT_PUBLIC_SITE_URL for preview builds.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://timeline.sumarhus.com";
