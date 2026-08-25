export function AppNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl tracking-tight">見つかりません</h1>
      <p className="mt-3 text-sm text-muted">この頁はありません。</p>
      <a href="/" className="mt-6 text-sm font-medium text-primary underline-offset-4 hover:underline">
        帳面へ戻る
      </a>
    </main>
  );
}
