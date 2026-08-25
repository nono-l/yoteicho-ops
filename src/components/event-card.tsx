import type { ScheduleEvent } from "@/lib/schedule/types";
import { formatJstWhen } from "@/lib/schedule/time";
import { cn } from "@/lib/cn";

/** 時刻だけでなく「いつの何時から何時まで」を出す。作業机では予定IDも出す。 */
const kindClass: Record<ScheduleEvent["kind"], string> = {
  投稿: "text-kind-post border-kind-post/30 bg-kind-post/8",
  日次: "text-kind-daily border-kind-daily/30 bg-kind-daily/8",
  区切り: "text-kind-mile border-kind-mile/30 bg-kind-mile/8",
};

export function EventCard({
  event,
  showId = false,
}: {
  event: ScheduleEvent;
  showId?: boolean;
}) {
  const done = event.status === "done";
  return (
    <article
      className={cn(
        "rounded-lg border border-border bg-bg-elevated p-4",
        done && "opacity-80",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg leading-snug tracking-tight">{event.title}</p>
          <p className="mt-1 text-sm text-muted">{formatJstWhen(event.startsAt, event.endsAt)}</p>
          {showId ? (
            <p className="mt-1 font-mono text-xs text-subtle">予定ID {event.id}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium",
              kindClass[event.kind],
            )}
          >
            {event.kind}
          </span>
          {done ? (
            <span className="rounded-full border border-ok/30 bg-ok/8 px-2.5 py-1 text-xs font-medium text-ok">
              実施済
            </span>
          ) : null}
        </div>
      </div>
      {event.description ? (
        <p className="mt-3 text-sm leading-relaxed text-fg/80">{event.description}</p>
      ) : null}
      {done && event.resultNote ? (
        <p className="mt-3 text-sm leading-relaxed text-ok">{event.resultNote}</p>
      ) : null}
    </article>
  );
}
