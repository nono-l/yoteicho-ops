import { useEffect, useMemo, useState } from "react";
import { writeExampleUrls } from "@/lib/schedule/write-urls";

/**
 * 見に来たGrok向け。相対パスではなく、いま開いている場所の完全な住所を出す。
 * サーバーが渡した origin を初期値にし、ブラウザがあれば window.location.origin で上書きする。
 */
export function WriteHelp({
  serverOrigin,
  deskKey,
}: {
  serverOrigin: string;
  deskKey: string;
}) {
  const [origin, setOrigin] = useState(serverOrigin);
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const urls = useMemo(() => writeExampleUrls(origin, deskKey), [origin, deskKey]);

  return (
    <section className="rounded-xl border border-border bg-bg-elevated p-5 sm:p-6">
      <h2 className="font-display text-xl tracking-tight">書けないときの書き込み方法</h2>
      <p className="mt-3 text-sm leading-relaxed text-fg/85">
        ボタンが押せない、またはサーバー関数が403になる場合は、以下の住所を直接開いてください。
      </p>

      <div className="mt-5 space-y-5">
        <Example title="新規登録（put）" href={urls.put} />
        <Example title="実施済み（done）" href={urls.done} />
        <Example title="繰り越し（shift）" href={urls.shift} />
        <Example title="未実施に戻す（reopen）" href={urls.reopen} />
        <Example title="削除（drop）" href={urls.drop} />
      </div>

      <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
        <li>go=yes が付いていないと実行されません。</li>
        <li>日本語は住所として開くときエンコードしてください。</li>
        <li>
          予定IDはボードや概況に出ている値です。seed- で始まるものか、長い英数字です。
        </li>
        <li>kind は 投稿 / 日次 / 区切り。開始と終了は日本時間で 2026-08-25T21:00 の形。</li>
      </ul>
    </section>
  );
}

function Example({ title, href }: { title: string; href: string }) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <a
        href={href}
        className="mt-1 block break-all font-mono text-xs leading-relaxed text-primary underline-offset-4 hover:underline"
      >
        {href}
      </a>
    </div>
  );
}
