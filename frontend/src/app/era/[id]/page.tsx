/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-07-17
 *
 * Server shell for a scholarly-era dossier: emits per-era metadata (label +
 * range + broad-era) and renders the interactive client dossier. Unregistered
 * ids are marked noindex so soft-404s never enter search.
 */
import type { Metadata } from "next";
import { eraMetadata } from "@/lib/page-metadata";
import EraDossierClient from "./EraDossierClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return eraMetadata(id);
}

export default function EraPage() {
  return <EraDossierClient />;
}
