"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { SlidersHorizontal, X } from "lucide-react"
import { api } from "@/lib/api"

type Props = {
  countries: string[]
  categories: string[]
}

export default function HomeFilters({ countries, categories }: Props) {
  const [open, setOpen] = useState(false)
  const [goal, setGoal] = useState("")
  const [country, setCountry] = useState("")
  const [category, setCategory] = useState("")
  const [budget, setBudget] = useState(5000)
  const [period, setPeriod] = useState(30)

  const query = useMemo(() => new URLSearchParams({
    ...(country && { country }),
    ...(category && { category }),
    ...(goal && { goal }),
    maxPrice: String(budget),
    leadTime: String(period),
    pageSize: "1"
  }).toString(), [budget, category, country, goal, period])

  const { data } = useQuery({
    queryKey: ["home-filter-match", query],
    queryFn: () => api.resources(`?${query}`),
    staleTime: 60_000
  })

  const content = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--text-tertiary)]">智能筛选</p>
          <h3 className="mt-1 text-lg font-semibold">缩小渠道范围</h3>
        </div>
        <button className="p-2 text-[var(--text-secondary)] md:hidden" onClick={() => setOpen(false)} aria-label="关闭筛选">
          <X className="h-5 w-5" />
        </button>
      </div>

      <fieldset>
        <legend className="mb-2 text-xs text-[var(--text-tertiary)]">推广目标</legend>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-white/5 p-1">
          {["曝光", "转化", "口碑"].map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={goal === item}
              onClick={() => setGoal((current) => current === item ? "" : item)}
              className={`rounded-md px-2 py-2 text-xs transition hover:bg-white/10 hover:text-white ${goal === item ? "bg-white/10 text-white" : "text-[var(--text-secondary)]"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block text-xs text-[var(--text-tertiary)]">
        服务地区
        <select className="input mt-2" value={country} onChange={(event) => setCountry(event.target.value)}>
          <option value="">全部地区</option>
          {countries.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>

      <label className="block text-xs text-[var(--text-tertiary)]">
        渠道类型
        <select className="input mt-2" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">全部类型</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>

      <label className="block text-xs text-[var(--text-tertiary)]">
        预算上限 <span className="float-right text-[var(--text-primary)]">¥{budget.toLocaleString()}</span>
        <input className="mt-3 w-full accent-[var(--accent)]" type="range" min="500" max="20000" step="500" value={budget} onChange={(event) => setBudget(Number(event.target.value))} />
      </label>

      <label className="block text-xs text-[var(--text-tertiary)]">
        预计周期
        <select className="input mt-2" value={period} onChange={(event) => setPeriod(Number(event.target.value))}>
          <option value="7">7 天内</option>
          <option value="14">14 天内</option>
          <option value="30">30 天内</option>
          <option value="90">90 天内</option>
        </select>
      </label>

      <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 text-sm">
        <span className="text-[var(--text-secondary)]">当前匹配</span>
        <strong>{data ? `${data.total} 个资源` : "计算中"}</strong>
      </div>

      <a href={`/explore?${query}`} className="btn-primary w-full">查看匹配资源</a>
    </div>
  )

  return (
    <>
      <aside className="resource-surface hidden h-fit p-5 md:block lg:sticky lg:top-28 lg:col-start-2 lg:row-start-1">{content}</aside>
      <button className="btn-outline fixed bottom-5 right-5 z-40 shadow-elevated md:hidden" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" />筛选
      </button>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} aria-label="关闭筛选" />
          <div className="glass-surface absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl p-5">{content}</div>
        </div>
      )}
    </>
  )
}
