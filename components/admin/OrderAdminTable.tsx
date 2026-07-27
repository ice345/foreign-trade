"use client";

import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import type { OrderItem, PaginatedResponse } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";
import UploadButton from "@/components/UploadButton";
import { Trash2, AlertTriangle } from "lucide-react";

const statusLabel: Record<OrderItem["status"], string> = {
  PENDING: "待处理",
  QUOTED: "已报价",
  ACCEPTED: "已接受",
  RUNNING: "执行中",
  POSTED: "已发布",
  CONFIRMED: "已确认",
  CANCELLED: "已取消",
  REFUNDED: "已退款"
};

function nextStatuses(status: OrderItem["status"]) {
  const map: Record<OrderItem["status"], OrderItem["status"][]> = {
    PENDING: ["PENDING", "QUOTED"],
    QUOTED: ["QUOTED"],
    ACCEPTED: ["ACCEPTED", "RUNNING"],
    RUNNING: ["RUNNING", "POSTED"],
    POSTED: ["POSTED", "CONFIRMED"],
    CONFIRMED: ["CONFIRMED"],
    CANCELLED: ["CANCELLED"],
    REFUNDED: ["REFUNDED"]
  };
  return map[status];
}

export default function OrderAdminTable() {
  const [page, setPage] = useState(1);
  const { data: resp, refetch } = useQuery({
    queryKey: ["admin-orders", page],
    queryFn: () => fetcher<PaginatedResponse<OrderItem>>(`/api/orders?mode=admin&page=${page}&pageSize=20`)
  });

  const orders = resp?.data ?? [];
  const totalPages = resp ? Math.ceil(resp.total / resp.pageSize) : 1;

  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<OrderItem | null>(null);
  const [cancelReason, setCancelReason] = useState("管理员取消订单");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [quoteAmounts, setQuoteAmounts] = useState<Record<string, string>>({});

  const handleUpdate = async (order: OrderItem, payload: Partial<OrderItem>) => {
    setSaving(order.id);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "更新失败");
      toast.success("订单已更新");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新失败");
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/orders/${deleting.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason })
      });
      if (res.ok) {
        toast.success("订单已取消");
        refetch();
      } else {
        const data = await res.json();
        toast.error(data.error || "删除失败");
      }
    } catch {
      toast.error("删除失败");
    } finally {
      setDeleteLoading(false);
      setDeleting(null);
      setCancelReason("管理员取消订单");
    }
  };

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden p-0 border-white/5">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-6 py-4">资源</th>
              <th className="px-6 py-4">客户</th>
              <th className="px-6 py-4">金额</th>
              <th className="px-6 py-4">状态</th>
              <th className="px-6 py-4">发帖链接</th>
              <th className="px-6 py-4">截图</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.map((order) => (
              <tr key={order.id} className="text-white/70">
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{order.resource?.title ?? "(已删除)"}</div>
                  <div className="text-xs text-white/40">#{order.id.slice(0, 8)}</div>
                </td>
                <td className="px-6 py-4 text-xs">
                  {order.user?.email ?? order.user?.phone ?? "-"}
                </td>
                <td className="px-6 py-4">
                  {order.status === "PENDING" || order.status === "QUOTED" ? (
                    <input
                      className="input h-9 w-28"
                      type="number"
                      min="0.01"
                      step="0.01"
                      aria-label="报价金额"
                      value={quoteAmounts[order.id] ?? (order.amount ?? order.resourcePrice ?? "")}
                      onChange={(event) => setQuoteAmounts((current) => ({ ...current, [order.id]: event.target.value }))}
                    />
                  ) : order.amount == null ? "--" : `¥${order.amount.toFixed(2)}`}
                </td>
                <td className="px-6 py-4">
                  <select
                    className="input h-9 w-full max-w-[140px]"
                    value={order.status}
                    onChange={(event) => {
                      const status = event.target.value as OrderItem["status"];
                      handleUpdate(order, {
                        status,
                        ...(status === "QUOTED" && {
                          amount: Number(quoteAmounts[order.id] ?? order.amount ?? order.resourcePrice ?? 0)
                        })
                      });
                    }}
                  >
                    {nextStatuses(order.status).map((status) => (
                      <option key={status} value={status} className="bg-panel">
                        {statusLabel[status]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <input
                    className="input h-9 w-full min-w-[160px]"
                    defaultValue={order.postLink ?? ""}
                    placeholder="https://"
                    onBlur={(event) => handleUpdate(order, { postLink: event.target.value })}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="w-40">
                    <UploadButton
                      folder="screenshots"
                      currentUrl={order.screenshotUrl ?? undefined}
                      label="上传截图"
                      onUploaded={(url) => handleUpdate(order, { screenshotUrl: url })}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs">
                      {saving === order.id ? "保存中..." : "已同步"}
                    </span>
                    <button
                      onClick={() => setDeleting(order)}
                      className="rounded p-1.5 text-white/40 transition hover:bg-red-500/10 hover:text-red-400"
                      title="取消订单"
                      disabled={order.status === "CONFIRMED" || order.status === "CANCELLED" || order.status === "REFUNDED"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-white/40">
                  暂无订单
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="btn-outline text-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            上一页
          </button>
          <span className="text-sm text-white/50">
            {page} / {totalPages}
          </span>
          <button
            className="btn-outline text-sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            下一页
          </button>
        </div>
      )}

      <p className="text-xs text-white/40">
        管理员填写"发帖链接/截图链接"后，客户的进度追踪中心会自动显示。
      </p>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleting(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold">确认取消订单</h3>
                <p className="text-xs text-white/50">订单会保留记录；仅历史钱包扣款订单会生成退款流水</p>
              </div>
            </div>
            <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
              <div>资源：{deleting.resource?.title ?? "(已删除)"}</div>
              <div>客户：{deleting.user?.email ?? deleting.user?.phone ?? "-"}</div>
              <div>报价：{deleting.amount == null ? "尚未报价" : `¥${deleting.amount.toFixed(2)}`}</div>
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-white/60">取消原因</label>
              <textarea
                className="input w-full resize-none"
                rows={3}
                value={cancelReason}
                maxLength={500}
                onChange={(event) => setCancelReason(event.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="btn-outline flex-1"
                disabled={deleteLoading}
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 rounded-xl bg-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/30"
              >
                {deleteLoading ? "取消中..." : "确认取消"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
