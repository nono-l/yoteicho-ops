import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from "react";
import { CalendarPlus, Copy, Check } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { listPublicEvents } from "@/lib/schedule/api";
import { dayKey, weekdayLabel } from "@/lib/schedule/time";
import type { ScheduleEvent } from "@/lib/schedule/types";

/**
 * 公開の帳面。予定の追加はここからはしない。
 * 運営机の番地そのものは出さない。鍵を知っている人だけが下の欄から机を開ける。
 */
export const Route = createFileRoute("/")({
  loader: () => listPublicEvents(),
  component: Home,
});

function groupByDay(events: ScheduleEvent[]) {
  const groups: { key: string; label: string; events: ScheduleEvent[] }[] = [];
  const index = new Map<string, number>();
  for (const event of events) {
    const key = dayKey(event.startsAt);
    const existing = index.get(key);
    if (existing === undefined) {
      index.set(key, groups.length);
      groups.push({ key, label: weekdayLabel(event.startsAt), events: [event] });
    } else {
      groups[existing]?.events.push(event);
    }
  }
  return groups;
}

function currentWebcalHref() {
  return `webcal://${window.location.host}/calendar.ics`;
}

function Home() {
  const events = Route.useLoaderData();
  const groups = useMemo(() => groupByDay(events), [events]);
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [webcalHref, setWebcalHref] = useState("/calendar.ics");
  const [deskKey, setDeskKey] = useState("");
  const postCount = events.filter((event) => event.kind === "投稿").length;
  const mileCount = events.filter((event) => event.kind === "区切り").length;

  useEffect(() => {
    setWebcalHref(currentWebcalHref());
  }, []);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(currentWebcalHref());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function openWebcal(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    window.location.href = currentWebcalHref();
  }

  function openDesk(event: FormEvent) {
    event.preventDefault();
    const key = deskKey.trim();
    if (!key) return;
    void navigate({ to: "/desk/$key", params: { key } });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5 pb-16 pt-10 sm:px-8">
      <header className="mb-10">
        <p className="text-xs font-medium tracking-[0.2em] text-primary">YOTEICHO</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">よてい帳</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          Grokが書いた運営用の予定（投稿・日々の作業・区切り）を置きます。下のリンクからiPhoneのカレンダーへ取り込めます。予定の追加と実施の記録はGrok側の運営机から行います。
        </p>
        <p className="mt-4 font-mono text-xs text-subtle">
          これから {events.length}件 · 投稿 {postCount} · 区切り {mileCount}
        </p>
      </header>

      <section className="rounded-xl border border-border bg-bg-elevated p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <CalendarPlus className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl tracking-tight">iPhoneのカレンダーへ取り込む</h2>
            <p className="mt-3 text-sm leading-relaxed text-fg/85">
              下のボタンを開くと、カレンダーへの取り込みが始まります。一度取り込むと、こちらで書いた予定の更新も届きます。実施済みになった予定は届かなくなります。
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <a
                href={webcalHref}
                onClick={openWebcal}
                className="inline-flex min-h-11 items-center justify-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                カレンダーに追加
              </a>
              <Button type="button" variant="ghost" onClick={copyUrl} className="sm:w-40">
                {copied ? (
                  <>
                    <Check className="mr-1.5 size-4" />
                    コピー済み
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 size-4" />
                    リンクをコピー
                  </>
                )}
              </Button>
            </div>
            <p className="mt-4 truncate font-mono text-xs text-subtle">{webcalHref}</p>
            <a
              href="/calendar.ics"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              予定ファイルをダウンロード
            </a>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-tight">これから</h2>
        {groups.length === 0 ? (
          <p className="mt-6 text-sm text-muted">まだ予定はありません。Grokが書き込むとここに並びます。</p>
        ) : (
          <div className="mt-6 space-y-8">
            {groups.map((group) => (
              <section key={group.key}>
                <h3 className="mb-3 text-sm font-medium text-muted">{group.label}</h3>
                <div className="space-y-3">
                  {group.events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <section className="mt-16 rounded-xl border border-border bg-bg-elevated p-5 sm:p-6">
        <h2 className="font-display text-xl tracking-tight">運営机を開く</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          鍵を知っている人だけが、概況・ボード・記録のある運営机を開けます。鍵そのものはここに出していません。
        </p>
        <form onSubmit={openDesk} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Label htmlFor="desk-key">作業机の鍵</Label>
            <Input
              id="desk-key"
              name="key"
              autoComplete="off"
              spellCheck={false}
              value={deskKey}
              onChange={(e) => setDeskKey(e.target.value)}
              className="font-mono"
            />
          </div>
          <Button type="submit" className="sm:w-36">
            机を開く
          </Button>
        </form>
      </section>
    </main>
  );
}
