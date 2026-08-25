import type { ScheduleEvent } from "./types";
import { icsStamp } from "./time";

/**
 * iPhoneカレンダー購読用の本文。
 * タイムゾーンは Asia/Tokyo 固定。ホスト名はここに書かない。
 * 実施済みは出さない（未実施の予定だけ届ける）。
 */
function fold(line: string): string {
  const bytes = Array.from(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = "";
  for (const ch of bytes) {
    if (current.length + ch.length > 75) {
      out.push(current);
      current = ` ${ch}`;
    } else {
      current += ch;
    }
  }
  if (current) out.push(current);
  return out.join("\r\n");
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function eventsToIcs(events: ScheduleEvent[]): string {
  const now = icsStamp(new Date().toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//よてい帳//JP",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:よてい帳",
    "X-WR-TIMEZONE:Asia/Tokyo",
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Tokyo",
    "X-LIC-LOCATION:Asia/Tokyo",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0900",
    "TZOFFSETTO:+0900",
    "TZNAME:JST",
    "DTSTART:19700101T000000",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];

  for (const event of events) {
    if (event.status === "done") continue;
    lines.push(
      "BEGIN:VEVENT",
      fold(`UID:${event.id}@yoteicho`),
      `DTSTAMP:${now}`,
      `DTSTART;TZID=Asia/Tokyo:${icsStamp(event.startsAt)}`,
      `DTEND;TZID=Asia/Tokyo:${icsStamp(event.endsAt)}`,
      fold(`SUMMARY:${escapeText(`[${event.kind}] ${event.title}`)}`),
    );
    if (event.description.trim()) {
      lines.push(fold(`DESCRIPTION:${escapeText(event.description)}`));
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
