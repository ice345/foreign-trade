import CartClient from "./CartClient";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "需求清单 — GlobalPush",
  description: "管理待询价的推广资源，并批量提交推广需求。",
  robots: { index: false, follow: false },
});

export default function CartPage() {
  return (
    <main className="page-container py-12">
      <div className="mb-8"><p className="text-sm text-[var(--accent-soft)]">询价与撮合</p><h1 className="mt-2 text-3xl font-semibold">需求清单</h1><p className="mt-3 text-sm text-[var(--text-secondary)]">提交后由平台确认档期和执行要求，再提供正式报价。本步骤不收款，也不会扣除历史余额。</p></div>
      <CartClient />
    </main>
  );
}
