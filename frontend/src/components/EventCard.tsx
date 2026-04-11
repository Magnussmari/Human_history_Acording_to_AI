import type { HistoryEvent } from "@/types/history";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { CertaintyIndicator } from "./CertaintyIndicator";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: HistoryEvent;
}

export function EventCard({ event }: EventCardProps) {
  const catConfig = CATEGORY_CONFIG[event.category];

  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-5 transition-all hover:border-primary/30">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={cn("rounded px-2 py-0.5 text-xs font-medium", catConfig.color)}>
          {catConfig.label}
        </span>
        <CertaintyIndicator level={event.certainty} />
        <span className="text-xs text-muted-foreground">{event.region}</span>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground/50">
          {event.id}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">{event.title}</h3>
      <p className="text-sm text-foreground/70 leading-relaxed mb-4">{event.description}</p>

      {event.key_figures.length > 0 && (
        <div className="mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Key Figures
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {event.key_figures.map((fig) => (
              <span key={fig} className="rounded bg-muted px-2 py-0.5 text-xs text-foreground/80">
                {fig}
              </span>
            ))}
          </div>
        </div>
      )}

      {event.sources.length > 0 && (
        <div className="mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Sources
          </span>
          <div className="mt-1 space-y-1">
            {event.sources.map((src, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 font-mono",
                  src.contemporary ? "bg-green-900/30 text-green-400" : "bg-muted text-muted-foreground"
                )}>
                  {src.type.replace(/_/g, " ")}
                </span>
                <span className="text-foreground/60">{src.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {event.certainty_note && (
        <p className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-3 mt-3">
          {event.certainty_note}
        </p>
      )}
    </div>
  );
}
