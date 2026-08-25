import { createFileRoute, isRedirect, Link, notFound, redirect } from "@tanstack/react-router";
import { WriteHelp } from "@/components/write-help";
import {
  completeEvent,
  createEvent,
  getPublicOrigin,
  removeEvent,
  restoreEvent,
  shiftEvent,
  verifyDeskKey,
} from "@/lib/schedule/api";
import { EVENT_KINDS, type EventKind } from "@/lib/schedule/types";
import { jstInputToIso } from "@/lib/schedule/time";

/**
 * 見に来たGrok用の書き込み口。頁を開く（GET）だけで動かす。
 * go=yes のときだけ実行する。go=1 は使わない。
 *
 * op=put 書く / op=drop 消す / op=shift 今日へ繰り越す / op=done 実施済み / op=reopen 戻す
 */
type Search = {
  op?: string;
  go?: string;
  title?: string;
  kind?: string;
  startsAt?: string;
  endsAt?: string;
  memo?: string;
  id?: string;
};

function asSearch(raw: Record<string, unknown>): Search {
  const out: Search = {};
  for (const key of ["op", "go", "title", "kind", "startsAt", "endsAt", "memo", "id"] as const) {
    const value = raw[key];
    if (value == null || value === "") continue;
    out[key] = String(value);
  }
  return out;
}

function isKind(value: string): value is EventKind {
  return (EVENT_KINDS as readonly string[]).includes(value);
}

function isJstInput(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
}

export const Route = createFileRoute("/desk/$key/do")({
  validateSearch: (raw: Record<string, unknown>) => asSearch(raw),
  loaderDeps: ({ search }) => search,
  loader: async ({ params, deps }) => {
    const ok = await verifyDeskKey({ data: { key: params.key } });
    if (!ok) throw notFound();
    const origin = await getPublicOrigin();

    if (deps.go !== "yes") {
      return { mode: "help" as const, key: params.key, message: "", origin };
    }

    try {
      if (deps.op === "put") {
        const title = (deps.title ?? "").trim();
        const kind = deps.kind ?? "";
        const startsRaw = deps.startsAt ?? "";
        const endsRaw = deps.endsAt ?? "";
        const memo = (deps.memo ?? "").trim();
        if (!title) throw new Error("題が空です");
        if (!isKind(kind)) throw new Error("種類は投稿・日次・区切りのいずれかです");
        if (!isJstInput(startsRaw) || !isJstInput(endsRaw)) {
          throw new Error("開始と終了は 2026-08-25T21:00 の形（日本時間）です");
        }
        const startsAt = jstInputToIso(startsRaw);
        const endsAt = jstInputToIso(endsRaw);
        if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
          throw new Error("終了は開始より後にしてください");
        }
        await createEvent({
          data: {
            key: params.key,
            title,
            description: memo,
            startsAt,
            endsAt,
            kind,
          },
        });
        throw redirect({ to: "/desk/$key", params: { key: params.key } });
      }

      if (deps.op === "drop") {
        const id = (deps.id ?? "").trim();
        if (!id) throw new Error("予定IDが空です");
        await removeEvent({ data: { key: params.key, id } });
        throw redirect({ to: "/desk/$key", params: { key: params.key } });
      }

      if (deps.op === "shift") {
        const id = (deps.id ?? "").trim();
        if (!id) throw new Error("予定IDが空です");
        await shiftEvent({ data: { key: params.key, id } });
        throw redirect({ to: "/desk/$key", params: { key: params.key } });
      }

      if (deps.op === "done") {
        const id = (deps.id ?? "").trim();
        if (!id) throw new Error("予定IDが空です");
        await completeEvent({
          data: { key: params.key, id, note: (deps.memo ?? "").trim() },
        });
        throw redirect({ to: "/desk/$key", params: { key: params.key } });
      }

      if (deps.op === "reopen") {
        const id = (deps.id ?? "").trim();
        if (!id) throw new Error("予定IDが空です");
        await restoreEvent({ data: { key: params.key, id } });
        throw redirect({ to: "/desk/$key", params: { key: params.key } });
      }

      throw new Error("op は put / drop / shift / done / reopen です");
    } catch (err) {
      if (isRedirect(err)) throw err;
      return {
        mode: "help" as const,
        key: params.key,
        message: err instanceof Error ? err.message : "実行できませんでした",
        origin,
      };
    }
  },
  component: DoHelp,
});

function DoHelp() {
  const { key, message, origin } = Route.useLoaderData();
  const search = Route.useSearch();

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5 pb-16 pt-10 sm:px-8">
      <p className="text-xs font-medium tracking-[0.2em] text-primary">GROK向け 書き込み口</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">住所で予定を動かす</h1>
      <div className="mt-8">
        <WriteHelp serverOrigin={origin} deskKey={key} />
      </div>
      {message ? <p className="mt-4 text-sm text-danger">{message}</p> : null}

      <section className="mt-8 rounded-xl border border-border bg-bg-elevated p-5 sm:p-6">
        <h2 className="font-display text-xl tracking-tight">書く（put）</h2>
        <form method="get" className="mt-4 grid gap-4">
          <input type="hidden" name="op" value="put" />
          <input type="hidden" name="go" value="yes" />
          <label className="grid gap-1.5 text-sm">
            題
            <input
              name="title"
              required
              defaultValue={search.title ?? ""}
              className="min-h-11 rounded-sm border border-border bg-bg px-3"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            種類
            <select
              name="kind"
              defaultValue={search.kind || "投稿"}
              className="min-h-11 rounded-sm border border-border bg-bg px-3"
            >
              {EVENT_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            開始（日本時間 例 2026-08-25T21:00）
            <input
              name="startsAt"
              required
              defaultValue={search.startsAt ?? ""}
              placeholder="2026-08-25T21:00"
              className="min-h-11 rounded-sm border border-border bg-bg px-3 font-mono text-sm"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            終了（日本時間 例 2026-08-25T21:30）
            <input
              name="endsAt"
              required
              defaultValue={search.endsAt ?? ""}
              placeholder="2026-08-25T21:30"
              className="min-h-11 rounded-sm border border-border bg-bg px-3 font-mono text-sm"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            メモ
            <input
              name="memo"
              defaultValue={search.memo ?? ""}
              className="min-h-11 rounded-sm border border-border bg-bg px-3"
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg"
          >
            この内容で書く
          </button>
        </form>
      </section>

      <section className="mt-8 rounded-xl border border-border bg-bg-elevated p-5 sm:p-6">
        <h2 className="font-display text-xl tracking-tight">実施・繰り越し・削除</h2>
        <form method="get" className="mt-4 grid gap-4">
          <input type="hidden" name="go" value="yes" />
          <label className="grid gap-1.5 text-sm">
            予定ID
            <input
              name="id"
              required
              defaultValue={search.id ?? ""}
              className="min-h-11 rounded-sm border border-border bg-bg px-3 font-mono text-sm"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            操作
            <select name="op" defaultValue="done" className="min-h-11 rounded-sm border border-border bg-bg px-3">
              <option value="done">実施済みにする</option>
              <option value="shift">今日へ繰り越す</option>
              <option value="reopen">未実施に戻す</option>
              <option value="drop">消す</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            実施メモ（done のとき）
            <input
              name="memo"
              defaultValue={search.memo ?? ""}
              className="min-h-11 rounded-sm border border-border bg-bg px-3"
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg"
          >
            実行する
          </button>
        </form>
      </section>

      <Link
        to="/desk/$key"
        params={{ key }}
        className="mt-8 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        運営机へ戻る
      </Link>
    </main>
  );
}
