import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-[80vh] flex items-center justify-center px-4"
      style={{
        background: "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(232,200,138,0.04) 0%, transparent 70%)",
      }}
    >
      <div className="text-center max-w-lg">
        {/* Large decorative number */}
        <div
          className="text-[10rem] font-bold leading-none mb-2 tabular-nums select-none"
          style={{
            fontFamily: "var(--font-heading), Georgia, serif",
            background: "linear-gradient(135deg, rgba(232,200,138,0.15) 0%, rgba(232,200,138,0.04) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </div>

        <h1
          className="text-3xl sm:text-4xl font-bold mb-3"
          style={{ fontFamily: "var(--font-heading), serif", color: "var(--gold)" }}
        >
          This page has been lost to the ages
        </h1>

        <p className="text-muted-foreground mb-3 leading-relaxed text-sm">
          Like many historical records before it, this page has been consumed by the passage of time.
        </p>

        <p
          className="text-sm text-muted-foreground/60 mb-10 italic"
          style={{ fontFamily: "var(--font-heading), serif" }}
        >
          "History is written by those who leave traces. This URL left none."
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-all gold-button"
        >
          Return to the Eternal Codex
        </Link>
      </div>
    </div>
  );
}
