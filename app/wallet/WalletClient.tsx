"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Wallet, ArrowDownCircle, ArrowUpCircle, RefreshCw, Loader2 } from "lucide-react";
import type { WalletInfo, TransactionItem, PaginatedResponse } from "@/lib/types";
import { useState } from "react";
import Link from "next/link";

export default function WalletClient() {
  const [page, setPage] = useState(1);

  const { data: wallet, isLoading: walletLoading, isError: walletError } = useQuery<WalletInfo>({
    queryKey: ["wallet"],
    queryFn: api.wallet
  });

  const { data: txData, isLoading: txLoading, isError: txError } = useQuery<PaginatedResponse<TransactionItem>>({
    queryKey: ["wallet-transactions", page],
    queryFn: () => api.walletTransactions(page)
  });

  const totalPages = txData ? Math.ceil(txData.total / txData.pageSize) : 1;

  return (
    <div className="page-container py-16">
      <h1 className="mb-8 text-3xl font-semibold">我的钱包</h1>

      <div className="mb-8 rounded-2xl border border-white/10 bg-gradient-to-br from-accent/10 via-transparent to-transparent p-8">
        <div className="flex items-center gap-3 text-sm text-white/50">
          <Wallet className="h-5 w-5" />
          可用余额
        </div>
        {walletLoading ? (
          <div className="mt-3 flex items-center gap-2 text-white/50">
            <Loader2 className="h-5 w-5 animate-spin" />
            加载中...
          </div>
        ) : walletError ? (
          <div className="mt-3 text-sm text-red-400">加载余额失败，请刷新页面重试</div>
        ) : (
          <>
            <div className="mt-3 text-4xl font-bold text-white">
              ¥{wallet?.balance.toFixed(2) ?? "0.00"}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Link href="/wallet/topup" className="btn-primary text-sm">
                去充值
              </Link>
              <span className="text-sm text-white/40">或联系管理员充值</span>
            </div>
          </>
        )}
      </div>

      <h2 className="mb-4 text-lg font-semibold">交易记录</h2>
      {txLoading ? (
        <div className="flex items-center justify-center py-10 text-white/50">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          加载中...
        </div>
      ) : txError ? (
        <div className="card py-10 text-center text-red-400">加载交易记录失败，请刷新页面重试</div>
      ) : (
        <div className="card overflow-hidden p-0 border-white/5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-6 py-4">类型</th>
                <th className="px-6 py-4">金额</th>
                <th className="px-6 py-4">描述</th>
                <th className="px-6 py-4">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {txData?.data.map((tx) => (
                <tr key={tx.id} className="text-white/70">
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2">
                      {tx.type === "TOPUP" ? (
                        <ArrowDownCircle className="h-4 w-4 text-green-400" />
                      ) : tx.type === "REFUND" ? (
                        <RefreshCw className="h-4 w-4 text-blue-400" />
                      ) : (
                        <ArrowUpCircle className="h-4 w-4 text-red-400" />
                      )}
                      {tx.type === "TOPUP" ? "充值" : tx.type === "REFUND" ? "退款" : "扣款"}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-medium ${tx.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {tx.amount >= 0 ? "+" : ""}¥{Math.abs(tx.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-white/50">{tx.description}</td>
                  <td className="px-6 py-4 text-xs text-white/40">
                    {new Date(tx.createdAt).toLocaleString("zh-CN")}
                  </td>
                </tr>
              ))}
              {(!txData?.data || txData.data.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-white/40">
                    暂无交易记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
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
    </div>
  );
}
