"use client";

import { motion } from "motion/react";
import { RefreshCw } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="min-h-[80vh] flex items-center justify-center px-4"
      style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(139,34,82,0.06) 0%, transparent 70%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="text-center max-w-md"
      >
        {/* Decorative glyph */}
        <div
          className="text-7xl mb-6 mx-auto w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(139,34,82,0.1)",
            border: "1px solid rgba(139,34,82,0.2)",
            color: "#c44b7a",
            fontFamily: "var(--font-heading), serif",
            fontSize: "2.5rem",
            fontWeight: 700,
          }}
        >
          ✕
        </div>

        <h1
          className="text-4xl font-bold mb-3"
          style={{ fontFamily: "var(--font-heading), serif", color: "var(--gold)" }}
        >
          Lost in Time
        </h1>

        <p className="text-muted-foreground mb-2 leading-relaxed">
          {error.message || "An unexpected error occurred while traversing the Codex."}
        </p>

        <p className="text-sm text-muted-foreground/60 mb-8 italic"
          style={{ fontFamily: "var(--font-heading), serif" }}
        >
          "Even the most meticulous record-keepers encounter missing scrolls."
        </p>

        <div className="flex items-center justify-center gap-3">
          <motion.button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium gold-button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <RefreshCw size={13} />
            Try again
          </motion.button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm text-muted-foreground border border-border/50 hover:border-border hover:text-foreground transition-colors"
          >
            Return to Codex
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-[10px] font-mono text-muted-foreground/30">
            digest: {error.digest}
          </p>
        )}
      </motion.div>
    </div>
  );
}
