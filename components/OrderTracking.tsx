"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, ImageIcon, Link2 } from "lucide-react"
import { toast } from "sonner"
import { fetcherOrNull } from "@/lib/api"
import type { OrderItem } from "@/lib/types"

const steps = ["PENDING", "QUOTED", "ACCEPTED", "RUNNING", "POSTED", "CONFIRMED"] as const
const statusLabels: Record<string, string> = {
  PENDING: "待评估",
  QUOTED: "已报价",
  ACCEPTED: "已接受",
  RUNNING: "执行中",
  POSTED: "已发布",
  CONFIRMED: "已确认",
  CANCELLED: "已取消",
  REFUNDED: "已退款"
}

export default function OrderTracking() {
  const queryClient = useQueryClient()
  const [accepting, setAccepting] = useState<string | null>(null)
  const { data } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetcherOrNull<OrderItem[]>("/api/orders")
  })

  const acceptQuote = async (id: string) => {
    setAccepting(id)
    try {
      const response = await fetch(`/api/orders/${id}/accept`, { method: "POST" })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "接受报价失败")
      toast.success("已接受报价，平台将安排执行")
      await queryClient.invalidateQueries({ queryKey: ["orders"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "接受报价失败")
    } finally {
      setAccepting(null)
    }
  }

  if (!data?.length) {
    return <div className="empty-state">暂无推广需求记录</div>
  }

  return (
    <div className="space-y-4">
      {data.map((order) => {
        const rawIndex = steps.indexOf(order.status as (typeof steps)[number])
        const currentIndex = rawIndex === -1 ? 0 : rawIndex
        const isClosed = order.status === "CANCELLED" || order.status === "REFUNDED"
        const title = order.resource?.title ?? order.resourceTitle ?? "历史推广资源"

        return (
          <article key={order.id} className="resource-surface space-y-5 p-5 md:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">需求编号 #{order.id.slice(0, 8)}</p>
              </div>
              <div className="sm:text-right">
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {order.amount == null ? "等待报价" : `报价 ¥${order.amount.toFixed(2)}`}
                </div>
                <div className={`mt-1 text-xs ${isClosed ? "text-[var(--danger)]" : "text-[var(--accent-soft)]"}`}>
                  {statusLabels[order.status]}
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-3 gap-2 md:grid-cols-6 ${isClosed ? "opacity-45" : ""}`}>
              {steps.map((step, index) => {
                const active = index <= currentIndex
                return (
                  <div key={step} className="min-w-0 text-center">
                    <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border text-xs ${active ? "border-[var(--accent)] bg-[var(--accent-muted)] text-white" : "border-[var(--border)] text-[var(--text-tertiary)]"}`}>
                      {index + 1}
                    </span>
                    <span className={`mt-2 block truncate text-xs ${active ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>
                      {statusLabels[step]}
                    </span>
                  </div>
                )
              })}
            </div>

            {order.status === "QUOTED" && (
              <div className="flex flex-col justify-between gap-4 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-muted)] p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium">报价等待确认</p>
                  {order.quoteNote && <p className="mt-1 text-sm text-[var(--text-secondary)]">{order.quoteNote}</p>}
                </div>
                <button className="btn-primary shrink-0" disabled={accepting === order.id} onClick={() => acceptQuote(order.id)}>
                  <CheckCircle2 className="h-4 w-4" />
                  {accepting === order.id ? "确认中" : "接受报价"}
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {order.screenshotUrl ? (
                <a className="btn-outline text-xs" href={order.screenshotUrl} target="_blank" rel="noreferrer">
                  <ImageIcon className="h-3.5 w-3.5" />查看截图
                </a>
              ) : null}
              {order.postLink ? (
                <a className="btn-outline text-xs" href={order.postLink} target="_blank" rel="noreferrer">
                  <Link2 className="h-3.5 w-3.5" />查看发布链接
                </a>
              ) : null}
            </div>
          </article>
        )
      })}
    </div>
  )
}
