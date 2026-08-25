import { Outlet, createFileRoute, notFound } from "@tanstack/react-router";
import { verifyDeskKey } from "@/lib/schedule/api";

/**
 * 運営机の親。鍵が違うと子頁ごと 404。
 * 子は index（マネジメント）と /do（GETの書き込み口）。
 */
export const Route = createFileRoute("/desk/$key")({
  loader: async ({ params }) => {
    const ok = await verifyDeskKey({ data: { key: params.key } });
    if (!ok) throw notFound();
    return { key: params.key };
  },
  component: DeskLayout,
});

function DeskLayout() {
  return <Outlet />;
}
