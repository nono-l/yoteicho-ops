/**
 * 時刻はすべて日本時間（Asia/Tokyo）で見せる・受け取る。
 * 内部の保存は ISO。入力欄は `2026-08-25T21:00`（datetime-local と同じ形）。
 *
 * 見に来たGrokが「いつの何時か」を落とさないよう、画面表示は年月日・曜日付き（formatJstWhen）。
 */
const JST = "Asia/Tokyo";

const MON_OFFSET: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

function parts(date: Date, options: Intl.DateTimeFormatOptions) {
  const map: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone: JST,
    hourCycle: "h23",
    ...options,
  }).formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return map;
}

function pad(value: string | undefined, size: number) {
  return (value ?? "").padStart(size, "0");
}

export function isoToJstInput(iso: string): string {
  const p = parts(new Date(iso), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${p.year}-${pad(p.month, 2)}-${pad(p.day, 2)}T${pad(p.hour, 2)}:${pad(p.minute, 2)}`;
}

export function jstInputToIso(local: string): string {
  const trimmed = local.length === 16 ? `${local}:00` : local;
  return new Date(`${trimmed}+09:00`).toISOString();
}

export function formatJstDate(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    weekday: "short",
    month: "numeric",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatJstTime(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function formatJstWhen(startIso: string, endIso: string): string {
  const start = new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(startIso));
  const sameDay = dayKey(startIso) === dayKey(endIso);
  const end = sameDay
    ? formatJstTime(endIso)
    : new Intl.DateTimeFormat("ja-JP", {
        timeZone: JST,
        month: "long",
        day: "numeric",
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date(endIso));
  return `${start} から ${end} まで`;
}

export function formatJstClock(iso: string = new Date().toISOString()): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    weekday: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function isDue(startsAt: string, nowIso: string): boolean {
  return new Date(startsAt).getTime() <= new Date(nowIso).getTime();
}

/**
 * 時刻を過ぎた未実施タスクを「今日」へ移す。
 * - 元の時:分が今日まだ先なら、今日のその時刻
 * - 今日もう過ぎていれば、いまの時刻
 * 長さ（開始〜終了）はそのまま。Grokは新しい行を書いて、古い行を消す。
 */
export function rolloverToToday(
  startsAt: string,
  endsAt: string,
  nowIso: string,
): { startsAt: string; endsAt: string } {
  const duration = Math.max(
    60_000,
    new Date(endsAt).getTime() - new Date(startsAt).getTime(),
  );
  const originalClock = isoToJstInput(startsAt).slice(11);
  const today = isoToJstInput(nowIso).slice(0, 10);
  let nextStart = jstInputToIso(`${today}T${originalClock}`);
  if (new Date(nextStart).getTime() <= new Date(nowIso).getTime()) {
    nextStart = jstInputToIso(isoToJstInput(nowIso));
  }
  return {
    startsAt: nextStart,
    endsAt: new Date(new Date(nextStart).getTime() + duration).toISOString(),
  };
}

export function icsStamp(iso: string): string {
  const p = parts(new Date(iso), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${p.year}${pad(p.month, 2)}${pad(p.day, 2)}T${pad(p.hour, 2)}${pad(p.minute, 2)}${pad(p.second, 2)}`;
}

export function dayKey(iso: string): string {
  const p = parts(new Date(iso), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return `${p.year}-${pad(p.month, 2)}-${pad(p.day, 2)}`;
}

export function weekdayLabel(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export function weekdayShort(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    weekday: "short",
  }).format(new Date(iso));
}

/** その日を含む月曜始まりの7日（日本時間）。各要素は YYYY-MM-DD。 */
export function jstWeekKeys(iso: string): string[] {
  const key = dayKey(iso);
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: JST,
    weekday: "short",
  }).format(new Date(iso));
  const offset = MON_OFFSET[wd] ?? 0;
  const monday = new Date(`${key}T12:00:00+09:00`);
  monday.setUTCDate(monday.getUTCDate() - offset);
  const keys: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + i);
    keys.push(dayKey(day.toISOString()));
  }
  return keys;
}

export function formatDayNumber(key: string): string {
  return String(Number(key.slice(8, 10)));
}
