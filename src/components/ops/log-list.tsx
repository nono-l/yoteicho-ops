import { ACTION_LABEL } from "@/lib/schedule/stats";
import { formatJstClock } from "@/lib/schedule/time";
import type { OpsLog } from "@/lib/schedule/types";

export function LogList({ logs }: { logs: OpsLog[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-subtle">まだ記録はありません。</p>;
  }
  return (
    <ol className="space-y-3">
      {logs.map((log) => (
        <li
          key={log.id}
          className="rounded-lg border border-border bg-bg-elevated px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium">{ACTION_LABEL[log.action]}</p>
            <p className="font-mono text-xs text-subtle">{formatJstClock(log.createdAt)}</p>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-fg/85">{log.note}</p>
          {log.eventId ? (
            <p className="mt-1 font-mono text-xs text-subtle">予定ID {log.eventId}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
