/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import { Newsreader, Inter_Tight, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import { Toaster } from "sonner";
import { VariantProvider } from "@/components/shell/VariantContext";
import { ChronographShell } from "@/components/shell/ChronographShell";
import { ChronographFooter } from "@/components/shell/ChronographFooter";
import "./globals.css";
import "@/components/shell/shell.css";

// Notebook typography — serif editorial (body + display), humanist sans for
// chrome/eyebrows, slab mono for codes and indices. These faces match the
// prototype's variant A spec: Newsreader / Inter Tight / IBM Plex Mono.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://human-history-acording-to-ai.vercel.app"),
  title: {
    default: "Chronograph — Human History According to AI",
    template: "%s · Chronograph",
  },
  description:
    "5,226 years of human civilization as an editorial folio. Year-by-year events, sources, certainty levels, and disconfirming evidence, researched by Claude Sonnet under the ICCRA schema.",
  applicationName: "Chronograph",
  authors: [{ name: "Magnús Smári Smárason", url: "https://smarason.is" }],
  creator: "Magnús Smári Smárason",
  keywords: [
    "history",
    "AI history",
    "Claude Sonnet",
    "ICCRA",
    "editorial folio",
    "historiography",
    "timeline",
    "sourced history",
    "Chronograph",
  ],
  openGraph: {
    type: "website",
    siteName: "Chronograph",
    title: "Chronograph — Human History According to AI",
    description:
      "Every year from 3,200 BCE to 2025 CE as a structured editorial folio. Events, key figures, sources, certainty, and the gaps we couldn't fill.",
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chronograph — Human History According to AI",
    description:
      "5,226 years of human civilization as an editorial folio — events, sources, certainty, and the gaps.",
    creator: "@magnussmari",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

function ShellFallback() {
  return (
    <header
      className="chronograph-chrome"
      aria-hidden="true"
      style={{ minHeight: 54 }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${interTight.variable} ${ibmPlexMono.variable} h-full`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="variant-a min-h-full flex flex-col">
        <Providers>
          <VariantProvider>
            <Suspense fallback={<ShellFallback />}>
              <ChronographShell />
            </Suspense>
            <main className="flex-1">{children}</main>
            <ChronographFooter />
          </VariantProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--card)",
                border: "1px solid var(--rule)",
                color: "var(--fg)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
