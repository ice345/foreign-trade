"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { AlertTriangle, FileText, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import type { CartItemData } from "@/lib/types"

export default function CartClient() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { data: items = [], isLoading } = useQuery({ queryKey: ["cart"], queryFn: () => api.cart() })

  const handleRemove = async (resourceId: string) => {
    try {
      await api.removeFromCart(resourceId)
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      queryClient.invalidateQueries({ queryKey: ["cartIds"] })
      toast.success("已移出需求清单")
    } catch { toast.error("移除失败") }
  }

  const handleBatchOrder = async () => {
    setSubmitting(true)
    try {
      const result = await api.batchOrder(items.map((item: CartItemData) => ({ resourceId: item.resourceId })))
      toast.success(`已提交 ${result.orderCount} 个推广需求`)
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      queryClient.invalidateQueries({ queryKey: ["cartIds"] })
      setConfirming(false)
      router.push("/orders")
    } catch (error) { toast.error(error instanceof Error ? error.message : "提交失败") } finally { setSubmitting(false) }
  }

  if (isLoading) return <p className="text-sm text-[var(--text-secondary)]">加载中...</p>
  if (!items.length) return <div className="flex flex-col items-center gap-4 py-20 text-[var(--text-tertiary)]"><FileText className="h-12 w-12" /><p>需求清单为空</p></div>

  return <div className="space-y-6">
    <div className="resource-surface overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-[var(--border)] text-xs text-[var(--text-tertiary)]"><tr><th className="px-5 py-4">推广资源</th><th className="px-5 py-4">参考价格</th><th className="px-5 py-4">预计周期</th><th className="px-5 py-4 text-right">操作</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{items.map((item: CartItemData) => <tr key={item.id}><td className="px-5 py-4"><p className="font-medium">{item.resource.title}</p><p className="mt-1 text-xs text-[var(--text-tertiary)]">{item.resource.category} · {item.resource.platform}</p></td><td className="px-5 py-4 text-[var(--text-secondary)]">{item.resource.price == null ? "待平台报价" : `¥${item.resource.price.toFixed(2)}`}</td><td className="px-5 py-4 text-[var(--text-secondary)]">{item.resource.leadTimeDays ? `${item.resource.leadTimeDays} 天` : "待确认"}</td><td className="px-5 py-4 text-right"><button onClick={() => handleRemove(item.resourceId)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition hover:bg-[rgba(240,125,132,0.12)] hover:text-[var(--danger)]" aria-label={`移除 ${item.resource.title}`}><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table>
    </div>
    <section className="admin-panel flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{items.length} 个待询价资源</p><p className="mt-1 text-sm text-[var(--text-secondary)]">提交后进入待评估，确认可执行方案后才会给出正式报价。</p></div><button onClick={() => setConfirming(true)} className="btn-primary shrink-0"><FileText className="h-4 w-4" />批量提交需求</button></section>
    {confirming && <div className="fixed inset-0 z-50 flex items-center justify-center p-5"><button className="absolute inset-0 bg-black/65" onClick={() => setConfirming(false)} aria-label="关闭确认窗口" /><section role="dialog" aria-modal="true" aria-labelledby="batch-order-title" className="glass-surface relative w-full max-w-md p-6"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-muted)]"><AlertTriangle className="h-5 w-5 text-[var(--accent-soft)]" /></span><div><h2 id="batch-order-title" className="font-semibold">确认提交推广需求</h2><p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">将创建 {items.length} 个待评估需求，不会扣款，也不会使用历史钱包余额。</p></div></div><div className="mt-5 flex gap-3"><button onClick={() => setConfirming(false)} className="btn-outline flex-1" disabled={submitting}>取消</button><button onClick={handleBatchOrder} disabled={submitting} className="btn-primary flex-1">{submitting ? "提交中..." : "确认提交"}</button></div></section></div>}
  </div>
}
