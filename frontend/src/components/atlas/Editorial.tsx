/**
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 *
 * Atlas editorial primitives. Page vocabulary for Methodology, About,
 * and the two-column Year page. Token-driven; consumers should not
 * reach past these primitives into raw CSS.
 *
 *   <EditorialPage>
 *     <Eyebrow>Methodology</Eyebrow>
 *     <PageTitle>How this was made</PageTitle>
 *     <Lede>…</Lede>
 *     <Section title="Schema">
 *       <Reading>…</Reading>
 *       <Aside>margin note</Aside>
 *     </Section>
 *     <Rule />
 *   </EditorialPage>
 */

import type { CSSProperties, ReactNode } from "react";

const BG: CSSProperties = {
  background: "var(--atlas-parchment)",
  color: "var(--atlas-ink)",
  fontFamily: "var(--atlas-font-sans)",
};

export function EditorialPage({ children }: { children: ReactNode }) {
  return (
    <div style={{ ...BG, minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: "min(96ch, 92vw)",
          margin: "0 auto",
          padding: "var(--atlas-space-8) var(--atlas-space-5) var(--atlas-space-9)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      className="atlas-eyebrow"
      style={{ marginBottom: "var(--atlas-space-4)" }}
    >
      {children}
    </p>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1
      style={{
        fontFamily: "var(--atlas-font-display)",
        fontSize: "clamp(2.25rem, 5vw, var(--atlas-text-display))",
        lineHeight: "var(--atlas-leading-tight)",
        letterSpacing: "var(--atlas-tracking-display)",
        color: "var(--atlas-ink)",
        margin: 0,
        fontWeight: 400,
        fontVariationSettings: "'SOFT' 30, 'WONK' 0",
      }}
    >
      {children}
    </h1>
  );
}

export function Lede({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--atlas-font-display)",
        fontSize: "var(--atlas-text-lede)",
        lineHeight: "var(--atlas-leading-normal)",
        color: "var(--atlas-ink-soft)",
        maxWidth: "var(--atlas-col-reading)",
        margin: "var(--atlas-space-5) 0 var(--atlas-space-6)",
        fontWeight: 400,
        fontVariationSettings: "'SOFT' 60, 'WONK' 0",
      }}
    >
      {children}
    </p>
  );
}

export function Section({
  id,
  title,
  eyebrow,
  children,
}: {
  id?: string;
  title?: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      style={{
        marginTop: "var(--atlas-space-8)",
        scrollMarginTop: "var(--atlas-space-7)",
      }}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      {title ? (
        <h2
          style={{
            fontFamily: "var(--atlas-font-display)",
            fontSize: "var(--atlas-text-heading)",
            lineHeight: "var(--atlas-leading-tight)",
            letterSpacing: "var(--atlas-tracking-display)",
            color: "var(--atlas-ink)",
            margin: "0 0 var(--atlas-space-5)",
            fontWeight: 500,
            fontVariationSettings: "'SOFT' 20, 'WONK' 0",
          }}
        >
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

export function Reading({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--atlas-font-display)",
        fontSize: "var(--atlas-text-reading)",
        lineHeight: "var(--atlas-leading-read)",
        color: "var(--atlas-ink)",
        maxWidth: "var(--atlas-col-reading)",
        fontVariationSettings: "'SOFT' 80, 'WONK' 0",
      }}
      className="atlas-reading"
    >
      {children}
    </div>
  );
}

export function Rule({ tone = "default" }: { tone?: "default" | "oxblood" }) {
  return (
    <hr
      style={{
        border: "none",
        borderTop: `1px solid ${
          tone === "oxblood" ? "var(--atlas-oxblood)" : "var(--atlas-parchment-edge)"
        }`,
        margin: "var(--atlas-space-7) 0",
      }}
    />
  );
}

export function Pullquote({
  children,
  attribution,
}: {
  children: ReactNode;
  attribution?: string;
}) {
  return (
    <blockquote
      style={{
        fontFamily: "var(--atlas-font-display)",
        fontSize: "var(--atlas-text-heading)",
        lineHeight: "var(--atlas-leading-tight)",
        color: "var(--atlas-ink)",
        borderLeft: "2px solid var(--atlas-leaf)",
        paddingLeft: "var(--atlas-space-5)",
        margin: "var(--atlas-space-6) 0",
        fontWeight: 400,
        fontStyle: "normal",
        maxWidth: "var(--atlas-col-reading)",
        fontVariationSettings: "'SOFT' 40, 'WONK' 0",
      }}
    >
      {children}
      {attribution ? (
        <footer
          style={{
            marginTop: "var(--atlas-space-3)",
            fontFamily: "var(--atlas-font-sans)",
            fontSize: "var(--atlas-text-small)",
            color: "var(--atlas-ink-mute)",
          }}
        >
          — {attribution}
        </footer>
      ) : null}
    </blockquote>
  );
}

export function DataList({
  items,
}: {
  items: { term: string; value: ReactNode }[];
}) {
  return (
    <dl
      style={{
        fontFamily: "var(--atlas-font-mono)",
        fontSize: "var(--atlas-text-small)",
        lineHeight: "var(--atlas-leading-normal)",
        color: "var(--atlas-ink)",
        display: "grid",
        gridTemplateColumns: "max-content 1fr",
        columnGap: "var(--atlas-space-5)",
        rowGap: "var(--atlas-space-2)",
        margin: "var(--atlas-space-5) 0",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {items.map((it) => (
        <div key={it.term} style={{ display: "contents" }}>
          <dt
            style={{
              color: "var(--atlas-ink-mute)",
              letterSpacing: "var(--atlas-tracking-mono)",
              textTransform: "uppercase",
              fontSize: "var(--atlas-text-micro)",
              paddingTop: "2px",
            }}
          >
            {it.term}
          </dt>
          <dd style={{ margin: 0, color: "var(--atlas-ink)" }}>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
