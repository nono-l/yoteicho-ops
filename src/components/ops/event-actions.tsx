import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import type { ScheduleEvent } from "@/lib/schedule/types";

export function EventActions({
  item,
  due,
  busy,
  onEdit,
  onDelete,
  onComplete,
  onShift,
  onRestore,
}: {
  item: ScheduleEvent;
  due: boolean;
  busy: boolean;
  onEdit: (event: ScheduleEvent) => void;
  onDelete: (id: string) => void;
  onComplete: (event: ScheduleEvent) => void;
  onShift?: (event: ScheduleEvent) => void;
  onRestore?: (event: ScheduleEvent) => void;
}) {
  const done = item.status === "done";
  return (
    <div className="space-y-2">
      <EventCard event={item} showId />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" disabled={busy} onClick={() => onEdit(item)}>
          直す
        </Button>
        {done ? (
          <Button type="button" variant="ghost" disabled={busy} onClick={() => onRestore?.(item)}>
            未実施に戻す
          </Button>
        ) : (
          <>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => onComplete(item)}>
              実施済み
            </Button>
            {due && onShift ? (
              <Button type="button" variant="ghost" disabled={busy} onClick={() => onShift(item)}>
                今日へ繰り越す
              </Button>
            ) : null}
          </>
        )}
        <Button type="button" variant="danger" disabled={busy} onClick={() => onDelete(item.id)}>
          消す
        </Button>
      </div>
    </div>
  );
}
