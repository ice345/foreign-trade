"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { fetcher } from "@/lib/api"
import { toast } from "sonner"
import { DollarSign, Trash2, AlertTriangle, X } from "lucide-react"

type UserRow = {
  id: string
  email?: string | null
  phone?: string | null
  role: string
  balance: number
  createdAt: string
}

export default function UserWalletManager() {
  const queryClient = useQueryClient()
  const [topUpTarget, setTopUpTarget] = useState<UserRow | null>(null)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("管理员充值")
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [deleting, setDeleting] = useState(false)

  const { data: users = [] } = useQuery<UserRow[]>({
    queryKey: ["admin-users"],
    queryFn: () => fetcher<UserRow[]>("/api/admin/users")
  })

  const handleTopUp = async () => {
    if (!topUpTarget || !amount) return
    const numAmount = Number(amount)
    if (numAmount <= 0) {
      toast.error("金额必须大于 0")
      return
    }

    setSubmitting(true)
    try {
      await fetcher("/api/wallet/topup", {
        method: "POST",
        body: JSON.stringify({
          userId: topUpTarget.id,
          amount: numAmount,
          description
        })
      })
      toast.success(`已为用户充值 ¥${numAmount.toFixed(2)}`)
      setTopUpTarget(null)
      setAmount("")
      setDescription("管理员充值")
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    } catch {
      toast.error("充值失败")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !deleteReason.trim()) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason.trim() })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success("用户已删除")
        setDeleteTarget(null)
        setDeleteReason("")
        queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      } else {
        toast.error(data.error || "删除失败")
      }
    } catch {
      toast.error("删除失败")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="card overflow-hidden p-0 border-white/5">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-6 py-4">用户</th>
              <th className="px-6 py-4">角色</th>
              <th className="px-6 py-4">余额</th>
              <th className="px-6 py-4">注册时间</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="text-white/70">
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{user.email ?? user.phone ?? "-"}</div>
                  <div className="text-xs text-white/40">#{user.id.slice(0, 8)}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${user.role === "ADMIN" ? "bg-accent/20 text-accent" : "bg-white/10 text-white/60"}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium">¥{user.balance.toFixed(2)}</td>
                <td className="px-6 py-4 text-xs text-white/40">
                  {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="btn-outline text-xs"
                      onClick={() => setTopUpTarget(user)}
                    >
                      <DollarSign className="mr-1 h-3 w-3" />
                      充值
                    </button>
                    {user.role !== "ADMIN" && (
                      <button
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10"
                        onClick={() => setDeleteTarget(user)}
                      >
                        <Trash2 className="mr-1 inline h-3 w-3" />
                        删除
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-white/40">
                  暂无用户
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {topUpTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setTopUpTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                充值 — {topUpTarget.email ?? topUpTarget.phone}
              </h3>
              <button onClick={() => setTopUpTarget(null)} className="text-white/50 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">充值金额 (¥)</label>
                <input
                  className="input w-full"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="输入金额"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">备注</label>
                <input
                  className="input w-full"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="充值备注"
                />
              </div>
              <div className="flex gap-3">
                <button className="btn-outline flex-1" onClick={() => setTopUpTarget(null)}>
                  取消
                </button>
                <button
                  className="btn-primary flex-1"
                  onClick={handleTopUp}
                  disabled={submitting || !amount}
                >
                  {submitting ? "处理中..." : "确认充值"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-red-500/20 bg-panel p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h3 className="text-lg font-semibold text-red-400">删除用户</h3>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="text-white/50 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-1 text-sm text-white/70">
              确定要删除用户 <strong className="text-white">{deleteTarget.email ?? deleteTarget.phone}</strong> 吗？
            </p>
            <p className="mb-4 text-xs text-red-400/80">
              此操作不可撤销，用户的所有数据将被永久删除。
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">
                  删除原因（必填，将通知用户）
                </label>
                <textarea
                  className="input w-full resize-none"
                  rows={3}
                  maxLength={500}
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="请说明删除该用户的原因..."
                />
                <div className="mt-1 text-right text-xs text-white/30">
                  {deleteReason.length}/500
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  className="btn-outline flex-1"
                  onClick={() => {
                    setDeleteTarget(null)
                    setDeleteReason("")
                  }}
                >
                  取消
                </button>
                <button
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                  onClick={handleDelete}
                  disabled={deleting || !deleteReason.trim()}
                >
                  {deleting ? "删除中..." : "确认删除"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
