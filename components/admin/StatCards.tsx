"use client";

import { ShoppingCart, DollarSign, Clock, Package, Users } from "lucide-react";

type Props = {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    activeResources: number;
    totalUsers: number;
  };
};

const cards = [
  { key: "totalOrders", label: "总订单", icon: ShoppingCart, format: (v: number) => v.toString() },
  { key: "totalRevenue", label: "总收入", icon: DollarSign, format: (v: number) => `¥${v.toFixed(2)}` },
  { key: "pendingOrders", label: "待处理", icon: Clock, format: (v: number) => v.toString() },
  { key: "activeResources", label: "活跃资源", icon: Package, format: (v: number) => v.toString() },
  { key: "totalUsers", label: "用户数", icon: Users, format: (v: number) => v.toString() }
] as const;

export default function StatCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {cards.map(({ key, label, icon: Icon, format }) => (
        <div
          key={key}
          className="card flex flex-col gap-3 border-white/5"
        >
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Icon className="h-4 w-4" />
            {label}
          </div>
          <div className="text-2xl font-bold text-white">
            {format(summary[key])}
          </div>
        </div>
      ))}
    </div>
  );
}
