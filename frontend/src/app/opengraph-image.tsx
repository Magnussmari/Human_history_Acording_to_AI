/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 *
 * Open Graph + Twitter card. Next.js 16 auto-wires any opengraph-image.tsx
 * file as <meta property="og:image"> for the route and generates
 * Content-Type, dimensions, and twitter:image:src automatically.
 *
 * Aesthetic: the Notebook folio. Cream parchment with ruled lines,
 * oxblood FOLIO stamp, oversized Newsreader italic title, triple-stat
 * strip, double rule. 1200 × 630 — Facebook / LinkedIn / iMessage spec.
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt =
  "Chronograph — Human History According to AI. 5,226 years as an editorial folio.";

const NEWSREADER_URL =
  "https://fonts.gstatic.com/s/newsreader/v27/cY9BfjOCWMpb8QjKOXTZEcwDt7-SMw4O5Jxv.woff2";
const INTER_TIGHT_URL =
  "https://fonts.gstatic.com/s/intertight/v11/NGStv5HIAPAwkYJnWeMBp5I.woff2";

async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  return res.arrayBuffer();
}

export default async function OgImage() {
  const [newsreader, interTight] = await Promise.all([
    loadFont(NEWSREADER_URL),
    loadFont(INTER_TIGHT_URL),
  ]);

  // Notebook tokens (literal — ImageResponse doesn't resolve CSS vars).
  const BG = "#f4ede0";
  const FG = "#161b2e";
  const FG_2 = "#3a4058";
  const FG_MUTE = "#73788b";
  const STAMP = "#8a2b22";
  const RULE = "#241c18";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          // Ruled-paper background
          backgroundImage:
            "repeating-linear-gradient(transparent 0 31px, rgba(33,40,65,0.08) 31px 32px)",
          padding: "64px 80px",
          fontFamily: "'Inter Tight'",
          color: FG,
        }}
      >
        {/* Top row — FOLIO stamp + brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              padding: "6px 16px",
              border: `2px solid ${STAMP}`,
              color: STAMP,
              fontFamily: "'Inter Tight'",
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              transform: "rotate(-1.5deg)",
              borderRadius: 2,
            }}
          >
            Folio
          </span>
          <span
            style={{
              fontFamily: "'Inter Tight'",
              fontSize: 18,
              color: FG_MUTE,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Vol. I · 5,226 years · 17,991 events
          </span>
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: STAMP,
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontFamily: "'Newsreader'",
                fontSize: 26,
                fontWeight: 600,
                color: FG,
                letterSpacing: "-0.01em",
              }}
            >
              Chronograph
            </span>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginTop: 20 }}>
          <div
            style={{
              fontFamily: "'Newsreader'",
              fontSize: 124,
              fontWeight: 500,
              lineHeight: 1.0,
              letterSpacing: "-0.025em",
              color: FG,
              display: "flex",
            }}
          >
            Human History
          </div>
          <div
            style={{
              fontFamily: "'Newsreader'",
              fontStyle: "italic",
              fontSize: 72,
              fontWeight: 400,
              lineHeight: 1.1,
              color: FG_2,
              letterSpacing: "-0.015em",
              marginTop: 12,
              display: "flex",
            }}
          >
            according to AI
          </div>
          <div
            style={{
              marginTop: 32,
              fontFamily: "'Newsreader'",
              fontSize: 28,
              lineHeight: 1.45,
              color: FG,
              maxWidth: 1000,
              display: "flex",
            }}
          >
            Every year from 3,200 BCE to 2025 CE, researched year-by-year by
            Claude Sonnet under the ICCRA schema. Sources, certainty, and the
            gaps it couldn&apos;t fill — all visible.
          </div>
        </div>

        {/* Stats strip */}
        <div
          style={{
            display: "flex",
            gap: 64,
            paddingTop: 24,
            paddingBottom: 16,
            borderTop: `2px solid ${FG}`,
            borderBottom: `1px solid ${RULE}`,
            fontFamily: "'Inter Tight'",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 16,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: FG_MUTE,
                fontWeight: 600,
              }}
            >
              Entries filed
            </span>
            <span
              style={{
                fontFamily: "'Newsreader'",
                fontSize: 52,
                fontWeight: 500,
                color: FG,
                letterSpacing: "-0.02em",
                marginTop: 4,
              }}
            >
              5,226
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 16,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: FG_MUTE,
                fontWeight: 600,
              }}
            >
              Events documented
            </span>
            <span
              style={{
                fontFamily: "'Newsreader'",
                fontSize: 52,
                fontWeight: 500,
                color: FG,
                letterSpacing: "-0.02em",
                marginTop: 4,
              }}
            >
              17,991
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 16,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: FG_MUTE,
                fontWeight: 600,
              }}
            >
              Cross-references
            </span>
            <span
              style={{
                fontFamily: "'Newsreader'",
                fontSize: 52,
                fontWeight: 500,
                color: FG,
                letterSpacing: "-0.02em",
                marginTop: 4,
              }}
            >
              13,130
            </span>
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              alignSelf: "flex-end",
              fontSize: 16,
              color: FG_MUTE,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontFamily: "'Inter Tight'",
              fontWeight: 500,
            }}
          >
            human-history-acording-to-ai.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Newsreader", data: newsreader, style: "normal", weight: 500 },
        { name: "Inter Tight", data: interTight, style: "normal", weight: 600 },
      ],
    },
  );
}
