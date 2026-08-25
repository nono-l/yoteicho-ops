import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { EVENT_KINDS } from "./types";

/**
 * 画面内（作業机のボタン）から呼ぶ書き込み。同じ頁のブラウザ専用。
 *
 * 見に来たGrokがここへ直接送ると拒否されやすい（403）。それは鍵違いではない。
 * そのときは /desk/$key/do を頁として開く（INTENT.md）。
 *
 * 変更系は必ず desk key を一緒に受け取り、desk-key.server で確かめる。
 * 公開帳面の list だけは鍵なし（未実施のみ）。
 */
const kindSchema = z.enum(EVENT_KINDS);

const draftSchema = z.object({
  key: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  kind: kindSchema,
});

async function assertDeskKey(key: string) {
  const { isDeskKey } = await import("./desk-key.server");
  if (!isDeskKey(key)) throw new Error("権限がありません");
}

export const listPublicEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { listOpenScheduleEvents } = await import("./store.server");
  return listOpenScheduleEvents();
});

/** いまのリクエストの公開 origin。WebCal と同様、ビルド時ホストは使わない。 */
export const getPublicOrigin = createServerFn({ method: "GET" }).handler(async () => {
  const { getRequestUrl } = await import("@tanstack/react-start/server");
  const url = getRequestUrl({ xForwardedHost: true, xForwardedProto: true });
  return url.origin;
});

export const verifyDeskKey = createServerFn({ method: "POST" })
  .validator(z.object({ key: z.string() }))
  .handler(async ({ data }) => {
    const { isDeskKey } = await import("./desk-key.server");
    return isDeskKey(data.key);
  });

export const loadDesk = createServerFn({ method: "POST" })
  .validator(z.object({ key: z.string().min(1) }))
  .handler(async ({ data }) => {
    await assertDeskKey(data.key);
    const { listScheduleEvents, listOpsLogs } = await import("./store.server");
    const [events, logs] = await Promise.all([listScheduleEvents(), listOpsLogs()]);
    return { events, logs };
  });

export const createEvent = createServerFn({ method: "POST" })
  .validator(draftSchema)
  .handler(async ({ data }) => {
    await assertDeskKey(data.key);
    const { insertScheduleEvent } = await import("./store.server");
    return insertScheduleEvent({
      title: data.title,
      description: data.description,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      kind: data.kind,
    });
  });

export const updateEvent = createServerFn({ method: "POST" })
  .validator(draftSchema.extend({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await assertDeskKey(data.key);
    const { updateScheduleEvent } = await import("./store.server");
    return updateScheduleEvent({
      id: data.id,
      title: data.title,
      description: data.description,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      kind: data.kind,
    });
  });

export const removeEvent = createServerFn({ method: "POST" })
  .validator(z.object({ key: z.string().min(1), id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await assertDeskKey(data.key);
    const { deleteScheduleEvent } = await import("./store.server");
    await deleteScheduleEvent(data.id);
    return { ok: true as const };
  });

export const completeEvent = createServerFn({ method: "POST" })
  .validator(
    z.object({
      key: z.string().min(1),
      id: z.string().min(1),
      note: z.string().trim().max(2000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await assertDeskKey(data.key);
    const { markEventDone } = await import("./store.server");
    return markEventDone(data.id, data.note ?? "");
  });

export const restoreEvent = createServerFn({ method: "POST" })
  .validator(z.object({ key: z.string().min(1), id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await assertDeskKey(data.key);
    const { reopenEvent } = await import("./store.server");
    return reopenEvent(data.id);
  });

export const shiftEvent = createServerFn({ method: "POST" })
  .validator(z.object({ key: z.string().min(1), id: z.string().min(1) }))
  .handler(async ({ data }) => {
    await assertDeskKey(data.key);
    const { shiftScheduleEvent } = await import("./store.server");
    return shiftScheduleEvent(data.id, new Date().toISOString());
  });
