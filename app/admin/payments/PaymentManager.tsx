"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { fetcher } from "@/lib/api"
import { toast } from "sonner"
import { Plus, Trash2, X, Check, Ban, QrCode } from "lucide-react"
import type { PaginatedResponse } from "@/lib/types"
import UploadButton from "@/components/UploadButton"

type QrCode = {
  id: string
  type: "WECHAT" | "ALIPAY"
  imageUrl: string
  label?: string | null
  active: boolean
  createdAt: string
}

type PaymentReq = {
  id: string
  userId: string
  amount: number
  paymentMethod: "WECHAT" | "ALIPAY"
  status: "PENDING" | "APPROVED" | "REJECTED"
  note?: string | null
  screenshotUrl?: string | null
  referenceNo?: string | null
  createdAt: string
  user: { id: string; email?: string | null; phone?: string | null; nickname?: string | null }
}

const methodLabel: Record<string, string> = { WECHAT: "微信支付", ALIPAY: "支付宝" }
const statusLabel: Record<string, string> = { PENDING: "待审核", APPROVED: "已通过", REJECTED: "已拒绝" }
const statusColor: Record<string, string> = { PENDING: "text-amber-400", APPROVED: "text-green-400", REJECTED: "text-red-400" }

export default function PaymentManager() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<"qr" | "requests">("qr")
  const [adding, setAdding] = useState(false)
  const [qrType, setQrType] = useState<"WECHAT" | "ALIPAY">("WECHAT")
  const [qrImageUrl, setQrImageUrl] = useState("")
  const [qrLabel, setQrLabel] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [reqPage, setReqPage] = useState(1)
  const [processing, setProcessing] = useState<string | null>(null)

  const { data: qrCodes = [] } = useQuery<QrCode[]>({
    queryKey: ["admin-payment-qr"],
    queryFn: () => fetcher<QrCode[]>("/api/admin/payment-qr"),
    enabled: tab === "qr"
  })

  const { data: reqResp } = useQuery({
    queryKey: ["admin-payment-requests", reqPage],
    queryFn: () => fetcher<PaginatedResponse<PaymentReq>>(`/api/admin/payment-requests?page=${reqPage}&pageSize=20`),
    enabled: tab === "requests"
  })

  const requests = reqResp?.data ?? []
  const reqTotalPages = reqResp ? Math.ceil(reqResp.total / reqResp.pageSize) : 1

  const handleAddQr = async () => {
    if (!qrImageUrl) return
    setSubmitting(true)
    try {
      await fetcher("/api/admin/payment-qr", {
        method: "POST",
        body: JSON.stringify({ type: qrType, imageUrl: qrImageUrl, label: qrLabel || null })
      })
      toast.success("二维码已添加")
      setAdding(false)
      setQrImageUrl("")
      setQrLabel("")
      queryClient.invalidateQueries({ queryKey: ["admin-payment-qr"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "添加失败")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteQr = async (id: string) => {
    if (!confirm("确定删除该二维码？")) return
    try {
      await fetcher(`/api/admin/payment-qr/${id}`, { method: "DELETE" })
      toast.success("已删除")
      queryClient.invalidateQueries({ queryKey: ["admin-payment-qr"] })
    } catch {
      toast.error("删除失败")
    }
  }

  const handleToggleActive = async (qr: QrCode) => {
    try {
      await fetcher(`/api/admin/payment-qr/${qr.id}`, {
        method: "PUT",
        body: JSON.stringify({ active: !qr.active })
      })
      toast.success(qr.active ? "已禁用" : "已启用")
      queryClient.invalidateQueries({ queryKey: ["admin-payment-qr"] })
    } catch {
      toast.error("操作失败")
    }
  }

  const handleApprove = async (id: string, status: "APPROVED" | "REJECTED") => {
    setProcessing(id)
    try {
      await fetcher(`/api/admin/payment-requests/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status })
      })
      toast.success(status === "APPROVED" ? "已通过" : "已拒绝")
      queryClient.invalidateQueries({ queryKey: ["admin-payment-requests"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败")
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          className={`rounded-lg px-4 py-2 text-sm transition ${tab === "qr" ? "bg-accent text-white" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
          onClick={() => setTab("qr")}
        >
          收款二维码
        </button>
        <button
          className={`rounded-lg px-4 py-2 text-sm transition ${tab === "requests" ? "bg-accent text-white" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
          onClick={() => setTab("requests")}
        >
          充值请求
        </button>
      </div>

      {tab === "qr" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/50">管理收款二维码</p>
            <button className="btn-primary text-sm" onClick={() => setAdding(true)}>
              <Plus className="mr-1 h-4 w-4" />
              添加二维码
            </button>
          </div>

          {adding && (
            <div className="card border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">新增收款二维码</h3>
                <button onClick={() => setAdding(false)} className="text-white/50 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">支付方式</label>
                  <select
                    className="input w-full cursor-pointer appearance-none"
                    value={qrType}
                    onChange={(e) => setQrType(e.target.value as any)}
                  >
                    <option value="WECHAT" className="bg-panel">微信支付</option>
                    <option value="ALIPAY" className="bg-panel">支付宝</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">标签 (选填)</label>
                  <input
                    className="input w-full"
                    value={qrLabel}
                    onChange={(e) => setQrLabel(e.target.value)}
                    placeholder="例如：主账号"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">二维码图片</label>
                <UploadButton
                  folder="payment-qr"
                  onUploaded={(url) => setQrImageUrl(url)}
                  currentUrl={qrImageUrl || undefined}
                />
              </div>
              <div className="flex gap-2">
                <button className="btn-outline text-sm" onClick={() => setAdding(false)}>取消</button>
                <button className="btn-primary text-sm" onClick={handleAddQr} disabled={submitting || !qrImageUrl}>
                  {submitting ? "添加中..." : "添加"}
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {qrCodes.map((qr) => (
              <div key={qr.id} className={`card border-white/10 space-y-3 ${!qr.active ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${qr.type === "WECHAT" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>
                    {methodLabel[qr.type]}
                  </span>
                  {qr.label && <span className="text-xs text-white/40">{qr.label}</span>}
                </div>
                <div className="flex items-center justify-center rounded-lg bg-white/5 p-4">
                  <QrCode className="h-16 w-16 text-white/20" />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    className="text-xs text-white/50 hover:text-white"
                    onClick={() => handleToggleActive(qr)}
                  >
                    {qr.active ? "禁用" : "启用"}
                  </button>
                  <button
                    onClick={() => handleDeleteQr(qr.id)}
                    className="rounded p-1.5 text-white/40 transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {!qrCodes.length && (
              <div className="col-span-full card py-10 text-center text-white/40">
                暂无收款二维码，请先添加
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "requests" && (
        <div className="space-y-4">
          <div className="card overflow-hidden p-0 border-white/5">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-6 py-4">用户</th>
                  <th className="px-6 py-4">编号</th>
                  <th className="px-6 py-4">金额</th>
                  <th className="px-6 py-4">方式</th>
                  <th className="px-6 py-4">凭证</th>
                  <th className="px-6 py-4">状态</th>
                  <th className="px-6 py-4">时间</th>
                  <th className="px-6 py-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((r) => (
                  <tr key={r.id} className="text-white/70">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{r.user.nickname ?? r.user.email ?? r.user.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {r.referenceNo ? (
                        <span className="font-mono text-xs text-white/50">{r.referenceNo}</span>
                      ) : (
                        <span className="text-xs text-white/20">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">¥{r.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">{methodLabel[r.paymentMethod]}</td>
                    <td className="px-6 py-4">
                      {r.screenshotUrl ? (
                        <a
                          href={r.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <img
                            src={r.screenshotUrl}
                            alt="支付凭证"
                            className="h-10 w-10 rounded border border-white/10 object-cover hover:opacity-80 transition"
                          />
                        </a>
                      ) : (
                        <span className="text-xs text-white/20">无</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={statusColor[r.status]}>{statusLabel[r.status]}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40">
                      {new Date(r.createdAt).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(r.id, "APPROVED")}
                            disabled={processing === r.id}
                            className="rounded p-1.5 text-green-400 transition hover:bg-green-500/10"
                            title="通过"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleApprove(r.id, "REJECTED")}
                            disabled={processing === r.id}
                            className="rounded p-1.5 text-red-400 transition hover:bg-red-500/10"
                            title="拒绝"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-white/30">已处理</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!requests.length && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-white/40">
                      暂无充值请求
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {reqTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                className="btn-outline text-sm"
                onClick={() => setReqPage((p) => Math.max(1, p - 1))}
                disabled={reqPage <= 1}
              >
                上一页
              </button>
              <span className="text-sm text-white/50">{reqPage} / {reqTotalPages}</span>
              <button
                className="btn-outline text-sm"
                onClick={() => setReqPage((p) => Math.min(reqTotalPages, p + 1))}
                disabled={reqPage >= reqTotalPages}
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
