import { getSql } from "@/lib/db";
import { rolloverToToday } from "./time";
import {
  EVENT_KINDS,
  EVENT_STATUSES,
  OPS_ACTIONS,
  type EventKind,
  type EventStatus,
  type OpsAction,
  type OpsLog,
  type ScheduleEvent,
} from "./types";

/**
 * 予定と運営記録の保存。サーバー専用。
 * 時刻は timestamptz のまま持ち、表示側で日本時間にする。
 */
type EventRow = {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  kind: string;
  status: string;
  done_at: string | null;
  result_note: string;
};

type LogRow = {
  id: string;
  event_id: string | null;
  action: string;
  note: string;
  created_at: string;
};

function asKind(value: string): EventKind {
  return (EVENT_KINDS as readonly string[]).includes(value) ? (value as EventKind) : "日次";
}

function asStatus(value: string): EventStatus {
  return (EVENT_STATUSES as readonly string[]).includes(value) ? (value as EventStatus) : "open";
}

function asAction(value: string): OpsAction {
  return (OPS_ACTIONS as readonly string[]).includes(value) ? (value as OpsAction) : "put";
}

function toIso(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
}

function mapRow(row: EventRow): ScheduleEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startsAt: toIso(row.starts_at) ?? row.starts_at,
    endsAt: toIso(row.ends_at) ?? row.ends_at,
    kind: asKind(row.kind),
    status: asStatus(row.status),
    doneAt: toIso(row.done_at),
    resultNote: row.result_note ?? "",
  };
}

function mapLog(row: LogRow): OpsLog {
  return {
    id: row.id,
    eventId: row.event_id,
    action: asAction(row.action),
    note: row.note,
    createdAt: toIso(row.created_at) ?? row.created_at,
  };
}

async function writeLog(eventId: string | null, action: OpsAction, note: string) {
  const sql = await getSql();
  const id = crypto.randomUUID();
  await sql`
    insert into ops_log (id, event_id, action, note)
    values (${id}, ${eventId}, ${action}, ${note})
  `;
}

export async function listScheduleEvents(): Promise<ScheduleEvent[]> {
  const sql = await getSql();
  const rows = await sql<EventRow>`
    select id, title, description, starts_at::text as starts_at, ends_at::text as ends_at,
           kind, status, done_at::text as done_at, result_note
    from schedule_events
    order by starts_at asc
  `;
  return rows.map(mapRow);
}

export async function listOpenScheduleEvents(): Promise<ScheduleEvent[]> {
  const sql = await getSql();
  const rows = await sql<EventRow>`
    select id, title, description, starts_at::text as starts_at, ends_at::text as ends_at,
           kind, status, done_at::text as done_at, result_note
    from schedule_events
    where status = 'open'
    order by starts_at asc
  `;
  return rows.map(mapRow);
}

export async function getScheduleEvent(id: string): Promise<ScheduleEvent | null> {
  const sql = await getSql();
  const rows = await sql<EventRow>`
    select id, title, description, starts_at::text as starts_at, ends_at::text as ends_at,
           kind, status, done_at::text as done_at, result_note
    from schedule_events
    where id = ${id}
    limit 1
  `;
  const row = rows[0];
  return row ? mapRow(row) : null;
}

export async function listOpsLogs(): Promise<OpsLog[]> {
  const sql = await getSql();
  const rows = await sql<LogRow>`
    select id, event_id, action, note, created_at::text as created_at
    from ops_log
    order by created_at desc
    limit 80
  `;
  return rows.map(mapLog);
}

export async function insertScheduleEvent(
  draft: Pick<ScheduleEvent, "title" | "description" | "startsAt" | "endsAt" | "kind">,
): Promise<ScheduleEvent> {
  const sql = await getSql();
  const id = crypto.randomUUID();
  const rows = await sql<EventRow>`
    insert into schedule_events (id, title, description, starts_at, ends_at, kind, status)
    values (
      ${id}, ${draft.title}, ${draft.description},
      ${draft.startsAt}::timestamptz, ${draft.endsAt}::timestamptz, ${draft.kind}, 'open'
    )
    returning id, title, description, starts_at::text as starts_at, ends_at::text as ends_at,
              kind, status, done_at::text as done_at, result_note
  `;
  const row = rows[0];
  if (!row) throw new Error("予定を保存できませんでした");
  await writeLog(id, "put", `${draft.title} を書いた`);
  return mapRow(row);
}

export async function updateScheduleEvent(
  event: Pick<ScheduleEvent, "id" | "title" | "description" | "startsAt" | "endsAt" | "kind">,
): Promise<ScheduleEvent> {
  const sql = await getSql();
  const rows = await sql<EventRow>`
    update schedule_events
    set title = ${event.title},
        description = ${event.description},
        starts_at = ${event.startsAt}::timestamptz,
        ends_at = ${event.endsAt}::timestamptz,
        kind = ${event.kind}
    where id = ${event.id}
    returning id, title, description, starts_at::text as starts_at, ends_at::text as ends_at,
              kind, status, done_at::text as done_at, result_note
  `;
  const row = rows[0];
  if (!row) throw new Error("予定が見つかりません");
  await writeLog(event.id, "put", `${event.title} を直した`);
  return mapRow(row);
}

export async function deleteScheduleEvent(id: string): Promise<void> {
  const existing = await getScheduleEvent(id);
  const sql = await getSql();
  await sql`delete from schedule_events where id = ${id}`;
  await writeLog(id, "drop", existing ? `${existing.title} を消した` : "予定を消した");
}

export async function markEventDone(id: string, note: string): Promise<ScheduleEvent> {
  const sql = await getSql();
  const trimmed = note.trim();
  const rows = await sql<EventRow>`
    update schedule_events
    set status = 'done',
        done_at = now(),
        result_note = ${trimmed}
    where id = ${id}
    returning id, title, description, starts_at::text as starts_at, ends_at::text as ends_at,
              kind, status, done_at::text as done_at, result_note
  `;
  const row = rows[0];
  if (!row) throw new Error("予定が見つかりません");
  const mapped = mapRow(row);
  await writeLog(id, "done", trimmed || `${mapped.title} を実施済みにした`);
  return mapped;
}

export async function reopenEvent(id: string): Promise<ScheduleEvent> {
  const sql = await getSql();
  const rows = await sql<EventRow>`
    update schedule_events
    set status = 'open',
        done_at = null,
        result_note = ''
    where id = ${id}
    returning id, title, description, starts_at::text as starts_at, ends_at::text as ends_at,
              kind, status, done_at::text as done_at, result_note
  `;
  const row = rows[0];
  if (!row) throw new Error("予定が見つかりません");
  const mapped = mapRow(row);
  await writeLog(id, "reopen", `${mapped.title} を未実施に戻した`);
  return mapped;
}

export async function shiftScheduleEvent(
  id: string,
  nowIso: string,
): Promise<ScheduleEvent> {
  const existing = await getScheduleEvent(id);
  if (!existing) throw new Error("その予定IDはありません");
  if (existing.status === "done") throw new Error("実施済みの予定は繰り越せません");
  const next = rolloverToToday(existing.startsAt, existing.endsAt, nowIso);
  const sql = await getSql();
  const newId = crypto.randomUUID();
  const rows = await sql<EventRow>`
    insert into schedule_events (id, title, description, starts_at, ends_at, kind, status)
    values (
      ${newId}, ${existing.title}, ${existing.description},
      ${next.startsAt}::timestamptz, ${next.endsAt}::timestamptz, ${existing.kind}, 'open'
    )
    returning id, title, description, starts_at::text as starts_at, ends_at::text as ends_at,
              kind, status, done_at::text as done_at, result_note
  `;
  const row = rows[0];
  if (!row) throw new Error("繰り越せませんでした");
  await sql`delete from schedule_events where id = ${id}`;
  await writeLog(newId, "shift", `${existing.title} を今日へ繰り越した（前のID ${id}）`);
  return mapRow(row);
}
