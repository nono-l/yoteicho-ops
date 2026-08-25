/**
 * 見に来たGrok向けの書き込み住所。
 * ホストは呼び出し側が渡す（開いている頁の origin）。ソースに公開ドメインを書かない。
 * 表示用の題は平文、実際に開くときは日本語をエンコードする。
 */
export function publicOriginFromUrl(url: URL): string {
  return url.origin;
}

export function writeExampleUrls(origin: string, key: string) {
  const base = `${origin.replace(/\/$/, "")}/desk/${key}/do`;
  return {
    base,
    put: `${base}?op=put&go=yes&title=題名&kind=投稿&startsAt=2026-08-25T21:00&endsAt=2026-08-25T21:30&memo=メモ`,
    drop: `${base}?op=drop&go=yes&id=予定のUUID`,
    shift: `${base}?op=shift&go=yes&id=予定のUUID`,
    done: `${base}?op=done&go=yes&id=予定のUUID&memo=実施メモ`,
    reopen: `${base}?op=reopen&go=yes&id=予定のUUID`,
  };
}
