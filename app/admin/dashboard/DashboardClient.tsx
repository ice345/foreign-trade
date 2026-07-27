"use client";

import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import StatCards from "@/components/admin/StatCards";
import OrderChart from "@/components/admin/OrderChart";
import RevenueChart from "@/components/admin/RevenueChart";

type StatsData = {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    activeResources: number;
    totalUsers: number;
  };
  trends: {
    dailyOrders: { date: string; count: number }[];
    dailyRevenue: { date: string; revenue: number }[];
  };
  rankings: {
    topResources: { id: string; title: string; count: number }[];
    topUsers: { id: string; email: string | null; phone: string | null; total: number }[];
  };
};

export default function DashboardClient() {
  const { data, isLoading } = useQuery<StatsData>({
    queryKey: ["admin-stats"],
    queryFn: () => fetcher<StatsData>("/api/admin/stats")
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/40">
        加载中...
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <StatCards summary={data.summary} />

      <div className="grid gap-8 lg:grid-cols-2">
        <OrderChart data={data.trends.dailyOrders} />
        <RevenueChart data={data.trends.dailyRevenue} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card border-white/5">
          <h3 className="mb-4 text-lg font-semibold">资源热度 TOP 10</h3>
          <div className="space-y-2">
            {data.rankings.topResources.map((r, i) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span className="text-white/80">{r.title}</span>
                </span>
                <span className="text-white/50">{r.count} 单</span>
              </div>
            ))}
            {data.rankings.topResources.length === 0 && (
              <p className="text-sm text-white/40">暂无数据</p>
            )}
          </div>
        </div>

        <div className="card border-white/5">
          <h3 className="mb-4 text-lg font-semibold">用户接受报价 TOP 10</h3>
          <div className="space-y-2">
            {data.rankings.topUsers.map((u, i) => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span className="text-white/80">{u.email ?? u.phone ?? "-"}</span>
                </span>
                <span className="text-white/50">¥{u.total.toFixed(2)}</span>
              </div>
            ))}
            {data.rankings.topUsers.length === 0 && (
              <p className="text-sm text-white/40">暂无数据</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
