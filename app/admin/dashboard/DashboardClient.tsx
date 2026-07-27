"use client"

import { useQuery } from "@tanstack/react-query"
import { ArrowRight, ClipboardCheck, Clock3, Layers3, TrendingUp } from "lucide-react"
import Link from "next/link"
import { fetcher } from "@/lib/api"
import StatCards from "@/components/admin/StatCards"
import OrderChart from "@/components/admin/OrderChart"
import RevenueChart from "@/components/admin/RevenueChart"

type OrderStatus = "PENDING" | "QUOTED" | "ACCEPTED" | "RUNNING" | "POSTED" | "CONFIRMED" | "CANCELLED" | "REFUNDED"

type StatsData = {
  summary: {
    totalOrders: number
    acceptedQuoteValue: number
    pendingOrders: number
    activeResources: number
    totalUsers: number
    quotedOrders: number
    acceptedOrders: number
    quoteAcceptanceRate: number
  }
  trends: {
    dailyOrders: { date: string; count: number }[]
    dailyQuoteValue: { date: string; quoteValue: number }[]
  }
  pipeline: { status: OrderStatus; count: number }[]
  rankings: {
    topResources: { id: string; title: string; count: number }[]
    topUsers: { id: string; email: string | null; phone: string | null; total: number }[]
  }
  recentOrders: { id: string; status: OrderStatus; amount: number | null; createdAt: string; resourceTitle: string; user: string }[]
}

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "待评估", QUOTED: "已报价", ACCEPTED: "已接受", RUNNING: "执行中", POSTED: "已发布", CONFIRMED: "已确认", CANCELLED: "已取消", REFUNDED: "已退款"
}
const visiblePipeline: OrderStatus[] = ["PENDING", "QUOTED", "ACCEPTED", "RUNNING", "POSTED", "CONFIRMED"]

function Pipeline({ data, total }: { data: StatsData["pipeline"]; total: number }) {
  const counts = new Map(data.map((item) => [item.status, item.count]))
  return (
    <section className="admin-panel p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-[var(--text-tertiary)]">服务漏斗</p><h2 className="mt-1 text-lg font-semibold">从需求到确认</h2></div><Layers3 className="h-5 w-5 text-[var(--accent-soft)]" /></div>
      <ol className="mt-7 space-y-4">
        {visiblePipeline.map((status, index) => {
          const count = counts.get(status) ?? 0
          const percent = total ? Math.max(5, (count / total) * 100) : 5
          return <li key={status}>
            <div className="mb-2 flex items-center justify-between text-sm"><span className="text-[var(--text-secondary)]">{index + 1}. {statusLabels[status]}</span><strong className="font-medium">{count}</strong></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${percent}%`, opacity: 1 - index * 0.08 }} /></div>
          </li>
        })}
      </ol>
      <Link href="/admin/orders" className="mt-7 inline-flex items-center gap-2 text-sm text-[var(--accent-soft)] hover:text-white">进入订单工作台<ArrowRight className="h-4 w-4" /></Link>
    </section>
  )
}

function RankingList({ title, items, valueLabel }: { title: string; items: { id: string; title: string; value: string }[]; valueLabel: string }) {
  return <section className="admin-panel p-6"><div className="flex items-start justify-between"><div><p className="text-xs text-[var(--text-tertiary)]">运营信号</p><h2 className="mt-1 text-lg font-semibold">{title}</h2></div><TrendingUp className="h-5 w-5 text-[var(--accent-soft)]" /></div><ol className="mt-5 space-y-1.5">{items.length ? items.map((item, index) => <li className="flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 hover:bg-white/[0.035]" key={item.id}><span className="flex min-w-0 items-center gap-3"><span className="w-4 text-xs text-[var(--text-tertiary)]">{index + 1}</span><span className="truncate text-sm text-[var(--text-secondary)]">{item.title}</span></span><span className="shrink-0 text-sm font-medium">{item.value} {valueLabel}</span></li>) : <li className="py-8 text-center text-sm text-[var(--text-tertiary)]">数据积累后会在这里显示</li>}</ol></section>
}

function RecentOrders({ orders }: { orders: StatsData["recentOrders"] }) {
  return <section className="admin-panel overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5"><div><p className="text-xs text-[var(--text-tertiary)]">最近活动</p><h2 className="mt-1 text-lg font-semibold">新推广需求</h2></div><Link href="/admin/orders" className="text-sm text-[var(--accent-soft)] hover:text-white">全部订单</Link></div><div className="divide-y divide-[var(--border)]">{orders.length ? orders.map((order) => <Link key={order.id} href="/admin/orders" className="flex items-center justify-between gap-5 px-6 py-4 transition-colors hover:bg-white/[0.035]"><div className="min-w-0"><p className="truncate text-sm font-medium">{order.resourceTitle}</p><p className="mt-1 truncate text-xs text-[var(--text-tertiary)]">{order.user} · {new Date(order.createdAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p></div><div className="shrink-0 text-right"><span className="status-pill">{statusLabels[order.status]}</span><p className="mt-1.5 text-xs text-[var(--text-secondary)]">{order.amount == null ? "待报价" : `¥${order.amount.toFixed(2)}`}</p></div></Link>) : <p className="px-6 py-12 text-center text-sm text-[var(--text-tertiary)]">暂无订单活动</p>}</div></section>
}

export default function DashboardClient() {
  const { data, isLoading, isError } = useQuery<StatsData>({ queryKey: ["admin-stats"], queryFn: () => fetcher<StatsData>("/api/admin/stats") })

  if (isLoading) return <div className="admin-panel flex min-h-80 items-center justify-center text-sm text-[var(--text-tertiary)]">正在汇总运营数据...</div>
  if (isError || !data) return <div className="admin-panel flex min-h-80 items-center justify-center text-sm text-[var(--danger)]">数据面板暂时无法加载，请稍后重试。</div>

  return <div className="space-y-6">
    <section className="dashboard-hero overflow-hidden p-6 md:p-8"><div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><div className="inline-flex items-center gap-2 text-sm text-[var(--accent-soft)]"><ClipboardCheck className="h-4 w-4" />GlobalPush 控制中心</div><h1 className="mt-3 text-3xl font-semibold md:text-4xl">运营概览</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">聚焦询价、报价接受与服务履约。平台不代收用户资金，所有金额均为已确认的报价记录。</p></div><div className="flex gap-3"><Link href="/admin/orders" className="btn-primary">处理待办<ArrowRight className="h-4 w-4" /></Link><div className="hidden items-center gap-2 text-xs text-[var(--text-tertiary)] sm:flex"><Clock3 className="h-4 w-4" />实时数据库汇总</div></div></div></section>
    <StatCards summary={data.summary} />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.65fr)]"><div className="grid gap-6 lg:grid-cols-2"><OrderChart data={data.trends.dailyOrders} /><RevenueChart data={data.trends.dailyQuoteValue} /></div><Pipeline data={data.pipeline} total={data.summary.totalOrders} /></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)_minmax(300px,0.75fr)]"><RecentOrders orders={data.recentOrders} /><RankingList title="资源需求排行" valueLabel="单" items={data.rankings.topResources.map((item) => ({ id: item.id, title: item.title, value: String(item.count) }))} /><RankingList title="客户报价接受" valueLabel="" items={data.rankings.topUsers.map((item) => ({ id: item.id, title: item.email ?? item.phone ?? "未提供联系方式", value: `¥${item.total.toFixed(0)}` }))} /></div>
  </div>
}
