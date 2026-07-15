/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-15
 */
import type { Metadata } from "next";
import { MusicTimeline } from "./MusicTimeline";

export const metadata: Metadata = {
  title: "Classical Music & Opera",
  description:
    "A timeline of Western classical music and opera in twenty-nine eras, from Gregorian plainchant to twenty-first-century opera. Model-drafted Layer 1, evidenced by 162 peer-reviewed sources via Scite (Layer 2).",
  openGraph: {
    title: "A Timeline of Classical Music & Opera · Chronograph",
    description:
      "Twenty-nine eras of Western classical music and opera, from plainchant to contemporary opera. Model-drafted Layer 1 with per-era scholarly evidence: 162 peer-reviewed sources.",
    url: "/music",
  },
};

export default function MusicPage() {
  return <MusicTimeline />;
}
