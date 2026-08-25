/**
 * 予定の形。種類は三つだけにする（増やすと作業机の説明・Grokの運用が壊れる）。
 * startsAt / endsAt は ISO（内部）。画面とWebCalは日本時間で見せる。
 *
 * status: open = 未実施, done = 実施済。消すのは本当に不要なときだけ。
 * 詳細は INTENT.md。
 */
export const EVENT_KINDS = ["投稿", "日次", "区切り"] as const;
export const EVENT_STATUSES = ["open", "done"] as const;
export const OPS_ACTIONS = ["put", "drop", "shift", "done", "reopen"] as const;

export type EventKind = (typeof EVENT_KINDS)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];
export type OpsAction = (typeof OPS_ACTIONS)[number];

export type ScheduleEvent = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  kind: EventKind;
  status: EventStatus;
  doneAt: string | null;
  resultNote: string;
};

export type EventDraft = {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  kind: EventKind;
};

export type OpsLog = {
  id: string;
  eventId: string | null;
  action: OpsAction;
  note: string;
  createdAt: string;
};

export type DeskState = {
  events: ScheduleEvent[];
  logs: OpsLog[];
};
