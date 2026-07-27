"use client";

import { Activity, BadgeCheck, ClipboardList, Clock3, Package, Users } from "lucide-react";

type Props = {
  summary: {
    totalOrders: number;
    acceptedQuoteValue: number;
    pendingOrders: number;
    activeResources: number;
    totalUsers: number;
    quoteAcceptanceRate: number;
  };
};

const cards = [
  { key: "totalOrders", label: "累计推广需求", hint: "不含取消记录", icon: ClipboardList, format: (v: number) => v.toString() },
  { key: "acceptedQuoteValue", label: "已接受报价额", hint: "非平台收款", icon: BadgeCheck, format: (v: number) => `¥${v.toFixed(2)}` },
  { key: "pendingOrders", label: "待评估", hint: "需要优先处理", icon: Clock3, format: (v: number) => v.toString() },
  { key: "activeResources", label: "上线资源", hint: "当前可询价", icon: Package, format: (v: number) => v.toString() },
  { key: "totalUsers", label: "活跃用户", hint: "可正常使用", icon: Users, format: (v: number) => v.toString() },
  { key: "quoteAcceptanceRate", label: "报价接受率", hint: "接受 / 已报价", icon: Activity, format: (v: number) => `${(v * 100).toFixed(0)}%` }
] as const;

export default function StatCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {cards.map(({ key, label, hint, icon: Icon, format }) => (
        <div
          key={key}
          className="metric-panel flex min-h-36 flex-col justify-between p-5"
        >
          <div className="flex items-start justify-between gap-3 text-xs text-[var(--text-secondary)]">
            <div><p>{label}</p><p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{hint}</p></div>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-muted)] text-[var(--accent-soft)]"><Icon className="h-4 w-4" /></span>
          </div>
          <div className="text-2xl font-semibold tracking-tight text-white">
            {format(summary[key])}
          </div>
        </div>
      ))}
    </div>
  );
}
