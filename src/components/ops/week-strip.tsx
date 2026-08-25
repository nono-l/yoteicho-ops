import { formatDayNumber, weekdayShort } from "@/lib/schedule/time";
import type { DayCell } from "@/lib/schedule/stats";
import { cn } from "@/lib/cn";

export function WeekStrip({
  days,
  todayKey,
}: {
  days: DayCell[];
  todayKey: string;
}) {
  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
      {days.map((day) => {
        const total = day.open + day.done;
        const isToday = day.key === todayKey;
        const noonIso = `${day.key}T12:00:00+09:00`;
        return (
          <div
            key={day.key}
            className={cn(
              "flex min-h-20 flex-col items-center rounded-md border px-1 py-2 text-center",
              isToday
                ? "border-primary/40 bg-primary/8"
                : "border-border bg-bg-elevated",
            )}
          >
            <span className="text-xs font-medium text-muted">{weekdayShort(noonIso)}</span>
            <span className="mt-0.5 font-display text-lg leading-none tracking-tight">
              {formatDayNumber(day.key)}
            </span>
            <span className="mt-auto pt-2 font-mono text-xs tabular-nums text-subtle">
              {total === 0 ? "—" : `${day.done}/${total}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
