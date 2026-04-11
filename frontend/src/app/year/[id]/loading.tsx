export default function YearLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-6 animate-fade-in">
      {/* Back link */}
      <div className="h-4 w-32 rounded-full bg-muted/40 animate-pulse" />

      {/* Badge row */}
      <div className="flex gap-2 pt-4">
        <div className="h-6 w-24 rounded-full bg-muted/50 animate-pulse" style={{ animationDelay: "60ms" }} />
        <div className="h-6 w-36 rounded-full bg-muted/40 animate-pulse" style={{ animationDelay: "120ms" }} />
      </div>

      {/* Year number */}
      <div
        className="h-24 w-56 rounded-lg animate-pulse"
        style={{
          background: "linear-gradient(90deg, rgba(212,175,119,0.08) 0%, rgba(212,175,119,0.04) 100%)",
          animationDelay: "80ms",
        }}
      />

      {/* Era context */}
      <div className="space-y-2">
        <div className="h-4 w-full max-w-2xl rounded bg-muted/30 animate-pulse" style={{ animationDelay: "100ms" }} />
        <div className="h-4 w-4/5 rounded bg-muted/25 animate-pulse" style={{ animationDelay: "140ms" }} />
        <div className="h-4 w-3/5 rounded bg-muted/20 animate-pulse" style={{ animationDelay: "180ms" }} />
      </div>

      {/* Events heading */}
      <div className="h-6 w-32 rounded bg-muted/40 animate-pulse mt-8" style={{ animationDelay: "120ms" }} />

      {/* Event cards */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-5 space-y-3"
            style={{
              background: "rgba(212,175,119,0.03)",
              border: "1px solid rgba(212,175,119,0.08)",
              animationDelay: `${i * 80}ms`,
            }}
          >
            <div className="flex gap-2">
              <div className="h-5 w-20 rounded-md bg-muted/50 animate-pulse" />
              <div className="h-5 w-16 rounded-full bg-muted/40 animate-pulse" />
              <div className="h-5 w-24 rounded bg-muted/30 animate-pulse ml-auto" />
            </div>
            <div className="h-6 w-3/4 rounded bg-muted/40 animate-pulse" />
            <div className="h-4 w-full rounded bg-muted/25 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-muted/20 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
