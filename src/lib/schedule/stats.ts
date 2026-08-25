import { dayKey, isDue, jstWeekKeys } from "./time";
import type { OpsLog, ScheduleEvent } from "./types";

export type DayCell = {
  key: string;
  open: number;
  done: number;
  posts: number;
};

export type OpsSummary = {
  todayKey: string;
  weekKeys: string[];
  days: DayCell[];
  todayOpen: ScheduleEvent[];
  overdue: ScheduleEvent[];
  upcoming: ScheduleEvent[];
  done: ScheduleEvent[];
  weekPosts: number;
  weekPostsDone: number;
  nextMilestone: ScheduleEvent | null;
  openCount: number;
  doneCount: number;
};

export function isOpen(event: ScheduleEvent): boolean {
  return event.status === "open";
}

export function buildOpsSummary(events: ScheduleEvent[], nowIso: string): OpsSummary {
  const todayKey = dayKey(nowIso);
  const weekKeys = jstWeekKeys(nowIso);
  const weekSet = new Set(weekKeys);
  const open = events.filter(isOpen);
  const done = events.filter((event) => event.status === "done");
  const overdue = open.filter((event) => isDue(event.startsAt, nowIso));
  const upcoming = open.filter((event) => !isDue(event.startsAt, nowIso));
  const todayOpen = open.filter((event) => dayKey(event.startsAt) === todayKey);
  const weekPosts = events.filter(
    (event) => event.kind === "投稿" && weekSet.has(dayKey(event.startsAt)),
  );
  const nextMilestone =
    upcoming.find((event) => event.kind === "区切り") ??
    overdue.find((event) => event.kind === "区切り") ??
    null;

  const days: DayCell[] = weekKeys.map((key) => {
    const onDay = events.filter((event) => dayKey(event.startsAt) === key);
    return {
      key,
      open: onDay.filter(isOpen).length,
      done: onDay.filter((event) => event.status === "done").length,
      posts: onDay.filter((event) => event.kind === "投稿").length,
    };
  });

  return {
    todayKey,
    weekKeys,
    days,
    todayOpen,
    overdue,
    upcoming,
    done,
    weekPosts: weekPosts.length,
    weekPostsDone: weekPosts.filter((event) => event.status === "done").length,
    nextMilestone,
    openCount: open.length,
    doneCount: done.length,
  };
}

export const ACTION_LABEL: Record<OpsLog["action"], string> = {
  put: "書いた",
  drop: "消した",
  shift: "繰り越した",
  done: "実施済みにした",
  reopen: "未実施に戻した",
};
