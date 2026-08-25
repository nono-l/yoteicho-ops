import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { EVENT_KINDS, type EventKind } from "@/lib/schedule/types";

export type EventFormDraft = {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  kind: EventKind;
};

export function EventForm({
  draft,
  onChange,
  editingId,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  draft: EventFormDraft;
  onChange: (next: EventFormDraft) => void;
  editingId: string | null;
  busy: boolean;
  error: string;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border bg-bg-elevated p-5 sm:p-6">
      <h2 className="font-display text-xl tracking-tight">
        {editingId ? "予定を直す" : "予定を書く"}
      </h2>
      <p className="mt-2 text-sm text-muted">
        時間は日本時間。終了は開始より後。題はカレンダーにそのまま出ます。
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="title">題</Label>
          <Input
            id="title"
            required
            value={draft.title}
            onChange={(e) => onChange({ ...draft, title: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="kind">種類</Label>
          <Select
            id="kind"
            value={draft.kind}
            onChange={(e) => onChange({ ...draft, kind: e.target.value as EventKind })}
          >
            {EVENT_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </Select>
        </div>
        <div className="hidden sm:block" />
        <div>
          <Label htmlFor="startsAt">開始（日本時間）</Label>
          <Input
            id="startsAt"
            type="datetime-local"
            required
            value={draft.startsAt}
            onChange={(e) => onChange({ ...draft, startsAt: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="endsAt">終了（日本時間）</Label>
          <Input
            id="endsAt"
            type="datetime-local"
            required
            value={draft.endsAt}
            onChange={(e) => onChange({ ...draft, endsAt: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">メモ</Label>
          <Textarea
            id="description"
            value={draft.description}
            onChange={(e) => onChange({ ...draft, description: e.target.value })}
          />
        </div>
      </div>
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>
          {editingId ? "上書きする" : "書き込む"}
        </Button>
        {editingId ? (
          <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>
            取り消し
          </Button>
        ) : null}
      </div>
    </form>
  );
}
