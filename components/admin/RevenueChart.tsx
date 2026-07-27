"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

type Props = {
  data: { date: string; quoteValue: number }[];
};

export default function RevenueChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    date: d.date.slice(5)
  }));

  return (
    <section className="admin-panel p-6">
      <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs text-[var(--text-tertiary)]">成交意向</p><h3 className="mt-1 text-lg font-semibold">已接受报价额</h3></div><span className="text-xs text-[var(--text-tertiary)]">近 30 天 · 非收款</span></div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6bc7be" stopOpacity={0.34} />
                <stop offset="100%" stopColor="#6bc7be" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.055)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#121926",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "12px"
              }}
              labelStyle={{ color: "rgba(255,255,255,0.6)" }}
              formatter={(value) => [`¥${Number(value ?? 0).toFixed(2)}`, "已接受报价额"]}
            />
            <Area
              type="monotone"
              dataKey="quoteValue"
              stroke="#6bc7be"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              name="已接受报价额"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
