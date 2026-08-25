-- よてい帳の予定表と運営記録。時刻は timestamptz。表示は日本時間。
-- 種まき行の id は Grok が見る「予定ID」になるので、運用中に勝手に変えない。

create table if not exists schedule_events (
  id          text primary key,
  title       text not null,
  description text not null default '',
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  kind        text not null default '日次',
  status      text not null default 'open',
  done_at     timestamptz,
  result_note text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists schedule_events_starts_at_idx
  on schedule_events (starts_at);

create index if not exists schedule_events_status_idx
  on schedule_events (status);

create table if not exists ops_log (
  id         text primary key,
  event_id   text,
  action     text not null,
  note       text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ops_log_created_at_idx
  on ops_log (created_at desc);

insert into schedule_events (id, title, description, starts_at, ends_at, kind, status, done_at, result_note)
values
  (
    'seed-done-0824',
    '投稿 1本',
    '技術思想を短く書く。リンクだけ貼らない。',
    '2026-08-24 21:00:00+09',
    '2026-08-24 21:30:00+09',
    '投稿',
    'done',
    '2026-08-24 21:28:00+09',
    '実施済み。スレッド1本。'
  ),
  (
    'seed-daily-0825',
    'タイムラインの確認',
    '自分の投稿と返信を見る。未実施なら今日へ繰り越す。',
    '2026-08-25 08:00:00+09',
    '2026-08-25 08:20:00+09',
    '日次',
    'open',
    null,
    ''
  ),
  (
    'seed-post-0825',
    '投稿 1本',
    '技術思想、成果物、気づきのいずれか。毎日1本を7日間続ける初日。',
    '2026-08-25 21:00:00+09',
    '2026-08-25 21:30:00+09',
    '投稿',
    'open',
    null,
    ''
  ),
  (
    'seed-post-0826',
    '投稿 1本',
    '成果物の作り方を短く書く。リンクだけ貼らない。',
    '2026-08-26 21:00:00+09',
    '2026-08-26 21:30:00+09',
    '投稿',
    'open',
    null,
    ''
  ),
  (
    'seed-post-0827',
    '投稿 1本',
    '設計の話。複雑さを増やさない理由を具体例で。',
    '2026-08-27 21:00:00+09',
    '2026-08-27 21:30:00+09',
    '投稿',
    'open',
    null,
    ''
  ),
  (
    'seed-post-0828',
    '投稿 1本',
    '自分のサイトの過程を1画面分だけ説明する。',
    '2026-08-28 21:00:00+09',
    '2026-08-28 21:30:00+09',
    '投稿',
    'open',
    null,
    ''
  ),
  (
    'seed-post-0829',
    '投稿 1本',
    '他者の技術投稿へ、中身のある返信を1件。',
    '2026-08-29 21:00:00+09',
    '2026-08-29 21:30:00+09',
    '投稿',
    'open',
    null,
    ''
  ),
  (
    'seed-review-0830',
    '週次の振り返り',
    '今週の投稿を見返す。来週のネタを3つ決める。',
    '2026-08-30 21:00:00+09',
    '2026-08-30 21:45:00+09',
    '日次',
    'open',
    null,
    ''
  ),
  (
    'seed-post-0831',
    '投稿 1本',
    '7日連続の最終日。短くても出す。',
    '2026-08-31 21:00:00+09',
    '2026-08-31 21:30:00+09',
    '投稿',
    'open',
    null,
    ''
  ),
  (
    'seed-mile-0831',
    '区切り：7日連続投稿',
    '毎日1投稿を7日間続けられたか確認する。',
    '2026-08-31 22:00:00+09',
    '2026-08-31 22:20:00+09',
    '区切り',
    'open',
    null,
    ''
  ),
  (
    'seed-mile-0907',
    '区切り：週5本',
    '週あたりの投稿を5本以上にできているか見る。',
    '2026-09-07 22:00:00+09',
    '2026-09-07 22:20:00+09',
    '区切り',
    'open',
    null,
    ''
  ),
  (
    'seed-mile-0915',
    '区切り：平均閲覧100',
    '1投稿あたりの平均閲覧が100を超えたか見る。',
    '2026-09-15 22:00:00+09',
    '2026-09-15 22:20:00+09',
    '区切り',
    'open',
    null,
    ''
  ),
  (
    'seed-mile-0930',
    '区切り：フォロワー400',
    'フォロワーが400人を超えたか見る。',
    '2026-09-30 22:00:00+09',
    '2026-09-30 22:20:00+09',
    '区切り',
    'open',
    null,
    ''
  )
on conflict (id) do nothing;

insert into ops_log (id, event_id, action, note, created_at)
values
  (
    'log-0824-put',
    'seed-done-0824',
    'put',
    '投稿 1本 を書いた',
    '2026-08-24 12:10:00+09'
  ),
  (
    'log-0824-done',
    'seed-done-0824',
    'done',
    '実施済み。スレッド1本。',
    '2026-08-24 21:28:00+09'
  )
on conflict (id) do nothing;
