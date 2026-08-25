/**
 * 作業机の鍵。
 *
 * 【Git clone したエージェントへ】最初の作業はここを変えること。他の作業より先。
 * 今の値は、このビルドで振り直したもの。公開の帳面からは出さない。
 *
 * 変え方:
 *   openssl rand -hex 16
 * できた32桁を DESK_KEY に入れる。作業机の番地は `/desk/（この値）` になる。
 */
export const DESK_KEY = "88ef68b1676e682deb62059cbc3f521e";

export function isDeskKey(key: string): boolean {
  if (key.length !== DESK_KEY.length) return false;
  let mismatch = 0;
  for (let i = 0; i < DESK_KEY.length; i += 1) {
    mismatch |= key.charCodeAt(i) ^ DESK_KEY.charCodeAt(i);
  }
  return mismatch === 0;
}
