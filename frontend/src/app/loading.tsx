export default function Loading() {
  return (
    <div>
      {/* Hero skeleton */}
      <div
        className="min-h-[100svh] flex flex-col items-center justify-center px-4 gap-8"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(232,200,138,0.04) 0%, transparent 70%)",
        }}
      >
        {/* Eyebrow */}
        <div className="h-7 w-48 rounded-full bg-muted/30 animate-pulse" />

        {/* Main heading lines */}
        <div className="text-center space-y-2">
          <div
            className="h-20 sm:h-28 w-64 sm:w-96 rounded-xl mx-auto animate-pulse"
            style={{
              background: "linear-gradient(90deg, rgba(232,200,138,0.12) 0%, rgba(232,200,138,0.06) 100%)",
            }}
          />
          <div
            className="h-20 sm:h-28 w-56 sm:w-80 rounded-xl mx-auto animate-pulse"
            style={{
              background: "linear-gradient(90deg, rgba(232,200,138,0.08) 0%, rgba(232,200,138,0.04) 100%)",
              animationDelay: "80ms",
            }}
          />
        </div>

        {/* Subtitle */}
        <div className="h-5 w-56 rounded bg-muted/30 animate-pulse" style={{ animationDelay: "120ms" }} />

        {/* Stats row */}
        <div className="flex items-center gap-12 mt-4">
          {/* Ring placeholder */}
          <div className="h-32 w-32 rounded-full border-4 border-muted/30 animate-pulse" />

          {/* Stat blocks */}
          <div className="grid grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center space-y-2" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="h-10 w-20 rounded bg-muted/30 animate-pulse mx-auto" />
                <div className="h-3 w-16 rounded bg-muted/20 animate-pulse mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex gap-3">
          <div className="h-11 w-44 rounded-lg bg-muted/30 animate-pulse" />
          <div className="h-11 w-44 rounded-lg bg-muted/20 animate-pulse" style={{ animationDelay: "80ms" }} />
        </div>
      </div>

      {/* Timeline skeleton */}
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
        <div className="text-center space-y-2 mb-8">
          <div
            className="h-10 w-48 rounded-xl mx-auto animate-pulse"
            style={{ background: "rgba(232,200,138,0.08)" }}
          />
          <div className="h-4 w-36 rounded bg-muted/25 animate-pulse mx-auto" />
        </div>
        {/* Controls row */}
        <div className="flex gap-3 mb-5">
          <div className="h-9 w-48 rounded-lg bg-muted/30 animate-pulse" />
          <div className="h-9 w-24 rounded-lg bg-muted/25 animate-pulse" />
          <div className="h-9 w-36 rounded-lg bg-muted/20 animate-pulse ml-auto" />
        </div>
        {/* Era pills */}
        <div className="flex gap-2 overflow-hidden mb-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-7 shrink-0 rounded-full bg-muted/30 animate-pulse"
              style={{ width: `${60 + i * 10}px`, animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
        {/* Card skeletons */}
        <div className="space-y-3 pl-7">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-5 flex gap-4"
              style={{
                background: "rgba(232,200,138,0.03)",
                border: "1px solid rgba(232,200,138,0.07)",
                animationDelay: `${i * 60}ms`,
              }}
            >
              <div className="w-16 space-y-2">
                <div className="h-8 w-full rounded bg-muted/40 animate-pulse" />
                <div className="h-3 w-8 rounded bg-muted/25 animate-pulse mx-auto" />
                <div className="flex gap-0.5 justify-center">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-1.5 w-1.5 rounded-full bg-muted/30 animate-pulse" />
                  ))}
                </div>
              </div>
              <div className="w-px bg-muted/20" />
              <div className="flex-1 space-y-2.5">
                <div className="flex gap-2">
                  <div className="h-5 w-20 rounded-full bg-muted/40 animate-pulse" />
                  <div className="h-5 w-16 rounded bg-muted/25 animate-pulse" />
                </div>
                <div className="h-4 w-full rounded bg-muted/25 animate-pulse" />
                <div className="h-4 w-4/5 rounded bg-muted/20 animate-pulse" />
                <div className="space-y-1">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="h-3 w-3/4 rounded bg-muted/15 animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
