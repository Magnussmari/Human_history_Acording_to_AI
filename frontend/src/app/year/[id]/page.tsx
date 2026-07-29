/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-17
 *
 * Server shell for a year folio: emits rich per-year metadata (title/OG/
 * description built from the year's own headline events) and renders the
 * interactive client folio. The data-fetching UI lives in YearFolioClient.
 */
import type { Metadata } from "next";
import { yearMetadata } from "@/lib/page-metadata";
import YearFolioClient from "./YearFolioClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return yearMetadata(Number(id));
}

export default function YearPage() {
  return <YearFolioClient />;
}
