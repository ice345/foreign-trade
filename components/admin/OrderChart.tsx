"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

type Props = {
  data: { date: string; count: number }[];
};

export default function OrderChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    date: d.date.slice(5)
  }));

  return (
    <section className="admin-panel p-6">
      <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs text-[var(--text-tertiary)]">需求节奏</p><h3 className="mt-1 text-lg font-semibold">近 30 天询价趋势</h3></div><span className="rounded-full bg-[var(--accent-muted)] px-2.5 py-1 text-xs text-[var(--accent-soft)]">平滑趋势</span></div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted}>
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
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#121926",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "12px"
              }}
              labelStyle={{ color: "rgba(255,255,255,0.6)" }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#8194ff"
              strokeWidth={2.5}
              dot={{ r: 0 }}
              activeDot={{ r: 4, fill: "#d4d9ff", stroke: "#8194ff", strokeWidth: 3 }}
              name="订单数"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
