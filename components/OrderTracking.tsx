"use client";

import { useQuery } from "@tanstack/react-query";
import { fetcherOrNull } from "@/lib/api";
import type { OrderItem } from "@/lib/types";
import { CheckCircle2, Link2, ImageIcon } from "lucide-react";

const steps = ["PENDING", "RUNNING", "POSTED", "CONFIRMED"];

const statusLabels: Record<string, string> = {
  PENDING: "待审核",
  RUNNING: "执行中",
  POSTED: "已发帖",
  CONFIRMED: "已确认",
  CANCELLED: "已取消",
  REFUNDED: "已退款"
};

export default function OrderTracking() {
  const { data } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetcherOrNull<OrderItem[]>("/api/orders")
  });

  if (!data?.length) {
    return <div className="text-sm text-white/50">暂无订单记录</div>;
  }

  return (
    <div className="space-y-4">
      {data.map((order) => {
        const rawIndex = steps.indexOf(order.status);
        const currentIndex = rawIndex === -1 ? 0 : rawIndex;
        const isClosed = order.status === "CANCELLED" || order.status === "REFUNDED";
        return (
          <div key={order.id} className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{order.resource?.title ?? "已删除资源"}</h3>
                <p className="text-xs text-white/50">订单号：{order.id.slice(0, 8)}</p>
              </div>
              <div className="text-right text-sm text-white/60">
                <div>金额 ¥{order.amount?.toFixed(2) ?? "0.00"}</div>
                {isClosed && (
                  <div className={order.status === "REFUNDED" ? "text-green-400" : "text-white/40"}>
                    {statusLabels[order.status]}
                  </div>
                )}
              </div>
            </div>

            <div className={`flex items-center gap-2 text-xs text-white/50 ${isClosed ? "opacity-50" : ""}`}>
              {steps.map((step, index) => {
                const isActive = index <= currentIndex;
                return (
                  <div key={step} className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                        isActive ? "border-accent bg-accent/20 text-accent" : "border-white/10 text-white/30"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className={isActive ? "text-white" : "text-white/40"}>{statusLabels[step]}</span>
                    {index < steps.length - 1 && <span className="mx-1 h-px w-6 bg-white/10" />}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                折扣码：{order.discountCode || "未填写"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                最终成交价：{order.finalPrice ? `¥${order.finalPrice.toFixed(2)}` : "未填写"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                时间：{order.startDate?.slice(0, 10) || "--"} 至 {order.endDate?.slice(0, 10) || "--"}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              {order.screenshotUrl ? (
                <a
                  className="btn-outline text-xs"
                  href={order.screenshotUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  查看截图
                </a>
              ) : (
                <button className="btn-outline text-xs opacity-40" disabled>
                  <ImageIcon className="h-3.5 w-3.5" />
                  查看截图
                </button>
              )}
              {order.postLink ? (
                <a
                  className="btn-outline text-xs"
                  href={order.postLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  跳转链接
                </a>
              ) : (
                <button className="btn-outline text-xs opacity-40" disabled>
                  <Link2 className="h-3.5 w-3.5" />
                  跳转链接
                </button>
              )}
              <button className="btn-outline text-xs opacity-60" disabled>
                <CheckCircle2 className="h-3.5 w-3.5" />
                下载全部截图
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
