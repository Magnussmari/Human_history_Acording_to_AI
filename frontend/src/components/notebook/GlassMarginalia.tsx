/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-06-04
 */
"use client";

/**
 * Quiet marginalia that appears only on the folio for the year 1423 — the year
 * to which the glass in "The Glass That Knew Everything" holds all of human
 * knowledge. A subtle nod, discoverable but not loud: a hairline note that
 * brightens on hover and opens the fine-press reader on smarason.is.
 *
 * Easter egg. Not linked from anywhere else.
 */
export function GlassMarginalia() {
  return (
    <aside className="glass-marginalia" aria-label="Marginalia">
      <a
        href="https://smarason.is/en/lesa-glerid"
        target="_blank"
        rel="noopener noreferrer"
        className="glass-marginalia-link"
      >
        <span className="glass-marginalia-cube" aria-hidden="true">
          <span className="glass-marginalia-cube-face" />
        </span>
        <span className="glass-marginalia-text">
          1423 — the year the glass knew
        </span>
      </a>
    </aside>
  );
}
