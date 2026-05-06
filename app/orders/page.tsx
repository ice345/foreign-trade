import OrderTracking from "@/components/OrderTracking";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "进度追踪 — GlobalPush",
  description: "查看推广订单执行状态与结果反馈。",
  robots: { index: false, follow: false },
});

export default function OrdersPage() {
  return (
    <div className="page-container py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">进度追踪中心</h1>
        <p className="text-sm text-white/60">查看推广执行状态与结果反馈。</p>
      </div>
      <OrderTracking />
    </div>
  );
}
