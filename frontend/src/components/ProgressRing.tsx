"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProgress } from "@/lib/data";
import { TOTAL_YEARS } from "@/lib/constants";
import { motion } from "motion/react";

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressRing({ size = 140, strokeWidth = 8, className }: ProgressRingProps) {
  const { data: progress } = useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
    refetchInterval: 60_000,
  });

  const completed = progress?.completed?.length ?? 0;
  const pct = completed / TOTAL_YEARS;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className={`relative flex items-center justify-center ${className ?? ""}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border/30"
        />
        {/* Progress arc */}
        <defs>
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4af77" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#f5e0b5" stopOpacity="1" />
            <stop offset="100%" stopColor="#c49a56" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gold-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          style={{ filter: "drop-shadow(0 0 6px rgba(212, 175, 119, 0.5))" }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          className="text-2xl font-bold tabular-nums"
          style={{ color: "var(--gold)", fontFamily: "var(--font-heading), serif" }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6, type: "spring", stiffness: 200 }}
        >
          {(pct * 100).toFixed(1)}%
        </motion.span>
        <motion.span
          className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.9 }}
        >
          complete
        </motion.span>
      </div>
    </div>
  );
}
