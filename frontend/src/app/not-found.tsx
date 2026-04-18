/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
import Link from "next/link";
import "@/components/notebook/notebook-folio.css";
import "@/components/hero-section.css";

export default function NotFound() {
  return (
    <section className="notebook-folio notebook-folio-missing">
      <span className="notebook-stamp">Unfiled</span>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(120px, 18vw, 200px)",
          fontWeight: 500,
          lineHeight: 0.88,
          letterSpacing: "-0.03em",
          color: "var(--fg)",
          fontStyle: "italic",
          margin: "24px 0 8px",
        }}
      >
        404
      </div>
      <h1
        className="notebook-folio-title"
        style={{ fontSize: "clamp(28px, 3.6vw, 40px)" }}
      >
        This page has no entry in the folio.
      </h1>
      <p className="notebook-folio-era-text">
        Like many historical records before it, this URL has left no trace.
        The corpus is still here — return to the timeline to find what you
        were after.
      </p>
      <Link
        href="/"
        className="notebook-hero-cta"
        style={{ marginTop: 24, display: "inline-flex", alignItems: "center" }}
      >
        ← Back to timeline
      </Link>
    </section>
  );
}
