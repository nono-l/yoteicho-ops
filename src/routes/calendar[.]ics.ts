import { createFileRoute } from "@tanstack/react-router";
import { eventsToIcs } from "@/lib/schedule/ics";

/**
 * カレンダー購読の本体。WebCal も通常のダウンロードも、最終的にはここを読む。
 * キャッシュしない。実施済みは出さない。
 */
export const Route = createFileRoute("/calendar.ics")({
  server: {
    handlers: {
      GET: async () => {
        const { listOpenScheduleEvents } = await import("@/lib/schedule/store.server");
        const events = await listOpenScheduleEvents();
        const body = eventsToIcs(events);
        return new Response(body, {
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": 'inline; filename="yoteicho.ics"',
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
