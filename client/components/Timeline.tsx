import { StageBadge } from "./StageBadge";
import { formatAddress, formatTimestamp } from "@/lib/format";
import type { TrackingEvent } from "@/lib/types";

export function Timeline({ events }: { events: TrackingEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="font-mono text-sm text-ink-soft">No checkpoints recorded yet.</p>
    );
  }

  return (
    <ol className="space-y-0">
      {events.map((event, index) => (
        <li key={index} className="relative border-l-2 border-rule pl-6 pb-7 last:pb-0">
          <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-ink bg-paper-card" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-ink-soft">{String(index + 1).padStart(2, "0")}</span>
            <StageBadge stage={event.stage} />
            <span className="font-mono text-xs text-ink-soft">{formatTimestamp(event.timestamp)}</span>
          </div>
          <p className="mt-1.5 font-body text-sm text-ink">
            {event.location || "Location not recorded"}
            {event.notes ? <span className="text-ink-soft"> — {event.notes}</span> : null}
          </p>
          <p className="mt-0.5 font-mono text-xs text-ink-soft">recorded by {formatAddress(event.actor)}</p>
        </li>
      ))}
    </ol>
  );
}
