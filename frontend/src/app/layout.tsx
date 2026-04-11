import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Human History According to AI",
  description:
    "5,226 years of human civilization, researched year-by-year by AI. Structured, sourced, machine-readable.",
  openGraph: {
    title: "Human History According to AI",
    description: "Every year from 2025 CE to 3200 BCE. Structured JSON with events, sources, and certainty levels.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
              <Link href="/" className="flex items-center gap-3">
                <span className="text-xl font-bold tracking-tight text-primary">
                  Human History
                </span>
                <span className="hidden sm:inline text-xs text-muted-foreground font-mono">
                  According to AI
                </span>
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <a
                  href="https://github.com/Magnussmari/Human_history_Acording_to_AI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  GitHub
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border/30 py-6 text-center text-xs text-muted-foreground">
            Built by{" "}
            <a href="https://smarason.is" className="text-primary hover:underline">
              Magnus Smarason
            </a>{" "}
            -- Claude Sonnet 4.6 -- ICCRA Schema
          </footer>
        </Providers>
      </body>
    </html>
  );
}
