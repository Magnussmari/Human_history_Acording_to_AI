export default function EraLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-6 animate-fade-in">
      <div className="h-5 w-32 rounded bg-muted/50 animate-pulse" />
      <div className="space-y-3 pt-4">
        <div className="flex gap-2">
          <div className="h-6 w-24 rounded-full bg-muted/50 animate-pulse" />
          <div className="h-6 w-32 rounded-full bg-muted/50 animate-pulse" />
        </div>
        <div className="h-20 w-64 rounded-lg bg-muted/40 animate-pulse" style={{ animationDelay: "100ms" }} />
        <div className="h-5 w-full max-w-xl rounded bg-muted/30 animate-pulse" style={{ animationDelay: "150ms" }} />
        <div className="h-5 w-3/4 rounded bg-muted/30 animate-pulse" style={{ animationDelay: "200ms" }} />
      </div>
      <div className="space-y-3 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-muted/30 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    </div>
  );
}
