import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { EventActions } from "@/components/ops/event-actions";
import { EventForm, type EventFormDraft } from "@/components/ops/event-form";
import { LogList } from "@/components/ops/log-list";
import { WeekStrip } from "@/components/ops/week-strip";
import { WriteHelp } from "@/components/write-help";
import { cn } from "@/lib/cn";
import {
  completeEvent,
  createEvent,
  getPublicOrigin,
  loadDesk,
  removeEvent,
  restoreEvent,
  shiftEvent,
  updateEvent,
} from "@/lib/schedule/api";
import { buildOpsSummary } from "@/lib/schedule/stats";
import { formatJstClock, formatJstDate, isoToJstInput, jstInputToIso } from "@/lib/schedule/time";
import type { EventKind, ScheduleEvent } from "@/lib/schedule/types";

const TABS = [
  { id: "overview", label: "概況" },
  { id: "board", label: "ボード" },
  { id: "log", label: "記録" },
  { id: "write", label: "書く" },
] as const;

type TabId = (typeof TABS)[number]["id"];
type Search = { tab?: TabId };

function asTab(value: unknown): TabId {
  return TABS.some((tab) => tab.id === value) ? (value as TabId) : "overview";
}

export const Route = createFileRoute("/desk/$key/")({
  validateSearch: (raw: Record<string, unknown>): Search => ({
    tab: asTab(raw.tab),
  }),
  loader: async ({ params }) => {
    const [desk, origin] = await Promise.all([
      loadDesk({ data: { key: params.key } }),
      getPublicOrigin(),
    ]);
    return {
      events: desk.events,
      logs: desk.logs,
      key: params.key,
      nowIso: new Date().toISOString(),
      origin,
    };
  },
  component: DeskPage,
});

const emptyDraft: EventFormDraft = {
  title: "",
  description: "",
  startsAt: "",
  endsAt: "",
  kind: "投稿" as EventKind,
};

function DeskPage() {
  const { events, logs, key, nowIso, origin } = Route.useLoaderData();
  const search = Route.useSearch();
  const tab = search.tab ?? "overview";
  const router = useRouter();
  const [clock, setClock] = useState(nowIso);
  const [draft, setDraft] = useState<EventFormDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const tick = window.setInterval(() => setClock(new Date().toISOString()), 30000);
    return () => window.clearInterval(tick);
  }, []);

  const summary = useMemo(() => buildOpsSummary(events, clock), [events, clock]);

  function fillFrom(event: ScheduleEvent) {
    setEditingId(event.id);
    setDraft({
      title: event.title,
      description: event.description,
      startsAt: isoToJstInput(event.startsAt),
      endsAt: isoToJstInput(event.endsAt),
      kind: event.kind,
    });
    void router.navigate({
      to: "/desk/$key",
      params: { key },
      search: { tab: "write" },
    });
  }

  async function run(task: () => Promise<void>, fail: string) {
    setBusy(true);
    setError("");
    try {
      await task();
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : fail);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const payload = {
        key,
        title: draft.title,
        description: draft.description,
        startsAt: jstInputToIso(draft.startsAt),
        endsAt: jstInputToIso(draft.endsAt),
        kind: draft.kind,
      };
      if (editingId) {
        await updateEvent({ data: { ...payload, id: editingId } });
      } else {
        await createEvent({ data: payload });
      }
      setDraft(emptyDraft);
      setEditingId(null);
    }, "保存できませんでした");
  }

  function onDelete(id: string) {
    if (!window.confirm("この予定を消しますか？記録には残ります。")) return;
    void run(async () => {
      await removeEvent({ data: { key, id } });
      if (editingId === id) {
        setEditingId(null);
        setDraft(emptyDraft);
      }
    }, "削除できませんでした");
  }

  function onComplete(item: ScheduleEvent) {
    void run(async () => {
      await completeEvent({ data: { key, id: item.id, note: "" } });
    }, "実施済みにできませんでした");
  }

  function onShift(item: ScheduleEvent) {
    void run(async () => {
      await shiftEvent({ data: { key, id: item.id } });
      if (editingId === item.id) {
        setEditingId(null);
        setDraft(emptyDraft);
      }
    }, "繰り越せませんでした");
  }

  function onRestore(item: ScheduleEvent) {
    void run(async () => {
      await restoreEvent({ data: { key, id: item.id } });
    }, "戻せませんでした");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 pb-16 pt-10 sm:px-8">
      <header className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-primary">GROK向け 運営机</p>
            <h1 className="mt-2 font-display text-4xl tracking-tight">よてい帳の運営マネジメント</h1>
            <p className="mt-3 text-sm text-muted">いま（日本時間） {formatJstClock(clock)}</p>
          </div>
          <div className="flex flex-wrap gap-x-4">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              公開の帳面
            </Link>
            <Link
              to="/desk/$key/do"
              params={{ key }}
              className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              書き込み口
            </Link>
          </div>
        </div>

        <nav className="mt-6 flex gap-1 overflow-x-auto">
          {TABS.map((item) => (
            <Link
              key={item.id}
              to="/desk/$key"
              params={{ key }}
              search={{ tab: item.id }}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center rounded-sm px-3 text-sm font-medium transition-colors duration-150",
                tab === item.id
                  ? "bg-primary text-primary-fg"
                  : "text-muted hover:bg-bg-subtle hover:text-fg",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {error ? <p className="mb-6 text-sm text-danger">{error}</p> : null}

      {tab === "overview" ? (
        <Overview
          summary={summary}
          busy={busy}
          onEdit={fillFrom}
          onDelete={onDelete}
          onComplete={onComplete}
          onShift={onShift}
          onRestore={onRestore}
        />
      ) : null}

      {tab === "board" ? (
        <Board
          summary={summary}
          busy={busy}
          onEdit={fillFrom}
          onDelete={onDelete}
          onComplete={onComplete}
          onShift={onShift}
          onRestore={onRestore}
        />
      ) : null}

      {tab === "log" ? (
        <section>
          <h2 className="font-display text-xl tracking-tight">運営記録</h2>
          <p className="mt-2 mb-6 text-sm text-muted">書いた・実施した・繰り越した履歴です。</p>
          <LogList logs={logs} />
        </section>
      ) : null}

      {tab === "write" ? (
        <div className="space-y-8">
          <section className="rounded-xl border border-border bg-bg-elevated p-5 sm:p-6">
            <h2 className="font-display text-xl tracking-tight">これは何か</h2>
            <p className="mt-3 text-sm leading-relaxed text-fg/85">
              Xアカウント（@mss_0337_2024）の運営用です。投稿の予定、日々の作業、区切りを書いて、本人のiPhoneカレンダーへ届けます。時刻になったら本人の確認を待たずに投稿する。
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-fg/85">
              <li>いまの日本時間と、予定時刻・予定IDを見る。</li>
              <li>Xを見て、すでに出ていたら「実施済み」。出ていなければ残す。</li>
              <li>時刻を過ぎて未実施なら、今日へ繰り越して前の予定は消す。</li>
              <li>新しい予定は下の欄に題・種類・日本時間の開始と終了・メモを入れて書く。</li>
              <li>種類は投稿・日次・区切りの三つだけ。</li>
              <li>ボタンが押せないときは書き込み口の住所を直接開く。go=yes のときだけ実行される。</li>
            </ol>
          </section>
          <EventForm
            draft={draft}
            onChange={setDraft}
            editingId={editingId}
            busy={busy}
            error=""
            onSubmit={onSubmit}
            onCancel={() => {
              setEditingId(null);
              setDraft(emptyDraft);
            }}
          />
          <WriteHelp serverOrigin={origin} deskKey={key} />
        </div>
      ) : null}
    </main>
  );
}

function Overview({
  summary,
  busy,
  onEdit,
  onDelete,
  onComplete,
  onShift,
  onRestore,
}: {
  summary: ReturnType<typeof buildOpsSummary>;
  busy: boolean;
  onEdit: (event: ScheduleEvent) => void;
  onDelete: (id: string) => void;
  onComplete: (event: ScheduleEvent) => void;
  onShift: (event: ScheduleEvent) => void;
  onRestore: (event: ScheduleEvent) => void;
}) {
  const mile = summary.nextMilestone;
  return (
    <div className="space-y-10">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="今日の残り" value={String(summary.todayOpen.length)} hint="未実施" />
        <Stat
          label="超過"
          value={String(summary.overdue.length)}
          hint="時刻を過ぎた未実施"
          warn={summary.overdue.length > 0}
        />
        <Stat
          label="今週の投稿"
          value={`${summary.weekPostsDone}/${summary.weekPosts}`}
          hint="実施済 / 予定"
        />
        <Stat
          label="次の区切り"
          value={mile ? formatJstDate(mile.startsAt) : "なし"}
          hint={mile ? mile.title : "未設定"}
        />
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl tracking-tight">今週</h2>
        <WeekStrip days={summary.days} todayKey={summary.todayKey} />
      </section>

      <section>
        <h2 className="font-display text-xl tracking-tight">時刻を過ぎた予定</h2>
        <p className="mt-2 mb-4 text-sm text-muted">
          すでにやっていたら実施済み。まだなら今日へ繰り越す。
        </p>
        <div className="space-y-3">
          {summary.overdue.length === 0 ? (
            <p className="text-sm text-subtle">時刻を過ぎた予定はありません。</p>
          ) : (
            summary.overdue.map((item) => (
              <EventActions
                key={item.id}
                item={item}
                due
                busy={busy}
                onEdit={onEdit}
                onDelete={onDelete}
                onComplete={onComplete}
                onShift={onShift}
                onRestore={onRestore}
              />
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl tracking-tight">今日の残り</h2>
        <div className="mt-4 space-y-3">
          {summary.todayOpen.filter((item) => !summary.overdue.includes(item)).length === 0 ? (
            <p className="text-sm text-subtle">今日の未実施は、超過分を除いてありません。</p>
          ) : (
            summary.todayOpen
              .filter((item) => !summary.overdue.includes(item))
              .map((item) => (
                <EventActions
                  key={item.id}
                  item={item}
                  due={false}
                  busy={busy}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onComplete={onComplete}
                  onRestore={onRestore}
                />
              ))
          )}
        </div>
      </section>
    </div>
  );
}

function Board({
  summary,
  busy,
  onEdit,
  onDelete,
  onComplete,
  onShift,
  onRestore,
}: {
  summary: ReturnType<typeof buildOpsSummary>;
  busy: boolean;
  onEdit: (event: ScheduleEvent) => void;
  onDelete: (id: string) => void;
  onComplete: (event: ScheduleEvent) => void;
  onShift: (event: ScheduleEvent) => void;
  onRestore: (event: ScheduleEvent) => void;
}) {
  const columns = [
    { title: "これから", items: summary.upcoming, due: false },
    { title: "超過", items: summary.overdue, due: true },
    { title: "実施済", items: summary.done.slice().reverse(), due: false },
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {columns.map((column) => (
        <section key={column.title} className="min-w-0">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="font-display text-xl tracking-tight">{column.title}</h2>
            <span className="font-mono text-xs tabular-nums text-subtle">{column.items.length}</span>
          </div>
          <div className="space-y-3">
            {column.items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-6 text-sm text-subtle">
                空です。
              </p>
            ) : (
              column.items.map((item) => (
                <EventActions
                  key={item.id}
                  item={item}
                  due={column.due}
                  busy={busy}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onComplete={onComplete}
                  onShift={column.due ? onShift : undefined}
                  onRestore={onRestore}
                />
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  warn = false,
}: {
  label: string;
  value: string;
  hint: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-2xl tracking-tight tabular-nums sm:text-3xl",
          warn && "text-warn",
        )}
      >
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-subtle">{hint}</p>
    </div>
  );
}
