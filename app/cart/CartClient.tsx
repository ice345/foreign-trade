"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingCart, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { fetcherOrNull } from "@/lib/api";
import type { CartItemData, WalletInfo } from "@/lib/types";
import { toast } from "sonner";
import { SERVICE_FEE } from "@/lib/constants";

export default function CartClient() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => api.cart()
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => fetcherOrNull<WalletInfo>("/api/wallet")
  });

  const balance = wallet?.balance ?? 0;

  const totalAmount = items.reduce((sum: number, item: CartItemData) => {
    const price = item.resource.price ?? 0;
    return sum + price + SERVICE_FEE;
  }, 0);

  const balanceEnough = balance >= totalAmount;

  const handleRemove = async (resourceId: string) => {
    try {
      await api.removeFromCart(resourceId);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cartIds"] });
      toast.success("已移除");
    } catch {
      toast.error("移除失败");
    }
  };

  const handleBatchOrder = async () => {
    setSubmitting(true);
    try {
      const batchItems = items.map((item: CartItemData) => ({
        resourceId: item.resourceId
      }));
      const result = await api.batchOrder(batchItems);
      toast.success(`成功创建 ${result.orderCount} 个订单`);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cartIds"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      setConfirming(false);
      router.push("/orders");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "下单失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-white/60">加载中...</p>;
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-white/50">
        <ShoppingCart className="h-12 w-12" />
        <p>购物车为空</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden border-white/5 p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-6 py-4">资源</th>
              <th className="px-6 py-4">单价</th>
              <th className="px-6 py-4">服务费</th>
              <th className="px-6 py-4">小计</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((item: CartItemData) => {
              const price = item.resource.price ?? 0;
              const subtotal = price + SERVICE_FEE;
              return (
                <tr key={item.id} className="text-white/70">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{item.resource.title}</div>
                    <div className="text-xs text-white/40">
                      {item.resource.category} · {item.resource.platform}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.resource.price != null ? `¥${price.toFixed(2)}` : "待询价"}
                  </td>
                  <td className="px-6 py-4">¥{SERVICE_FEE.toFixed(2)}</td>
                  <td className="px-6 py-4 font-medium text-white">¥{subtotal.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRemove(item.resourceId)}
                      className="rounded p-1.5 text-white/40 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card flex items-center justify-between border-white/5">
        <div className="space-y-1 text-sm">
          <div className="text-white/50">
            共 {items.length} 项 · 总金额{" "}
            <span className="text-lg font-semibold text-accent">¥{totalAmount.toFixed(2)}</span>
          </div>
          <div className="text-xs text-white/40">当前余额 ¥{balance.toFixed(2)}</div>
        </div>
        <button
          onClick={() => setConfirming(true)}
          disabled={!balanceEnough}
          className="btn-primary shadow-glow"
        >
          <ShoppingCart className="h-4 w-4" />
          {balanceEnough ? "批量下单" : "余额不足"}
        </button>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirming(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold">确认批量下单</h3>
                <p className="text-xs text-white/50">
                  将为 {items.length} 个资源创建订单，共扣款 ¥{totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="btn-outline flex-1"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={handleBatchOrder}
                disabled={submitting}
                className="btn-primary flex-1 shadow-glow"
              >
                {submitting ? "提交中..." : "确认下单"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
