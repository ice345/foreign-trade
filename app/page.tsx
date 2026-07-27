import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BadgePercent, Globe2, Newspaper, RefreshCcw, SearchCheck } from "lucide-react"
import SearchBar from "@/components/SearchBar"
import ResourceCard from "@/components/ResourceCard"
import HomeFilters from "@/components/HomeFilters"
import { prisma } from "@/lib/prisma"
import { serializeResourceSummary } from "@/lib/serializers"
import { buildMetadata } from "@/lib/metadata"
import { safeJsonLd } from "@/lib/security"

export const dynamic = "force-dynamic"

export const metadata = buildMetadata({
  title: "GlobalPush · 全球推广资源情报平台",
  description: "筛选海外媒体评测、优惠平台、返利渠道、社群资源与产品推广机会。"
})

async function getHomeData() {
  try {
    const [resourceCount, resources, countries, categoryGroups] = await Promise.all([
      prisma.resource.count({ where: { status: "ACTIVE" } }),
      prisma.resource.findMany({
        where: { status: "ACTIVE" },
        orderBy: [{ followers: "desc" }, { createdAt: "desc" }],
        take: 6
      }),
      prisma.resource.findMany({
        where: { status: "ACTIVE" },
        distinct: ["country"],
        select: { country: true },
        orderBy: { country: "asc" }
      }),
      prisma.resource.groupBy({
        by: ["category"],
        where: { status: "ACTIVE" },
        _count: { _all: true }
      })
    ])

    const ids = resources.map((resource) => resource.id)
    const reviewStats = ids.length ? await prisma.review.groupBy({
      by: ["resourceId"],
      where: { resourceId: { in: ids } },
      _avg: { rating: true },
      _count: true
    }) : []
    const reviewMap = new Map(reviewStats.map((item) => [item.resourceId, item]))
    const categories = categoryGroups
      .map((item) => ({ name: item.category, count: item._count._all }))
      .sort((a, b) => b.count - a.count)

    return {
      resourceCount,
      countryCount: countries.length,
      categoryCount: categories.length,
      countries: countries.map((item) => item.country),
      categories,
      resources: resources.map((resource) => {
        const stats = reviewMap.get(resource.id)
        return {
          ...serializeResourceSummary(resource),
          averageRating: stats?._avg.rating ?? null,
          reviewCount: stats?._count ?? 0
        }
      })
    }
  } catch (error) {
    console.error("[Homepage Data Error]", error)
    return { resourceCount: 0, countryCount: 0, categoryCount: 0, countries: [], categories: [], resources: [] }
  }
}

const categoryIcons = [BadgePercent, Newspaper, RefreshCcw]

export default async function HomePage() {
  const data = await getHomeData()
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GlobalPush",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://globalpush.com",
    description: "面向出海团队的全球推广资源情报与筛选平台。"
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <section className="relative isolate min-h-[680px] overflow-hidden border-b border-[var(--border)]">
        <Image src="/images/global-trade-network.jpg" alt="夜间地球与全球贸易连接网络" fill priority sizes="100vw" className="-z-20 object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,10,18,0.98)_0%,rgba(7,10,18,0.87)_42%,rgba(7,10,18,0.42)_76%,rgba(7,10,18,0.52)_100%)]" />
        <div className="page-container grid min-h-[680px] gap-12 py-20 lg:grid-cols-[minmax(0,1.25fr)_minmax(330px,0.55fr)] lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-soft)]">
              <Globe2 className="h-4 w-4" />全球推广资源情报平台
            </div>
            <h1 className="max-w-3xl text-[44px] font-semibold leading-[1.08] md:text-[56px] lg:text-[62px]">
              发现更适合产品的全球推广渠道
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-secondary)] md:text-lg">
              整合媒体评测、优惠平台、返利渠道、社群资源和产品推广机会，为出海团队提供更高效的资源发现与询价体验。
            </p>
            <div className="mt-8 max-w-2xl">
              <Suspense fallback={<div className="h-14 rounded-lg bg-white/5" />}><SearchBar /></Suspense>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/explore" className="btn-primary">探索全部资源<ArrowRight className="h-4 w-4" /></Link>
              <Link href="/orders" className="btn-outline">查看需求进度</Link>
            </div>
            <dl className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-white/10 pt-6">
              <div><dt className="text-xs text-[var(--text-tertiary)]">已筛选资源</dt><dd className="mt-2 text-2xl font-semibold">{data.resourceCount}</dd></div>
              <div><dt className="text-xs text-[var(--text-tertiary)]">服务地区</dt><dd className="mt-2 text-2xl font-semibold">{data.countryCount}</dd></div>
              <div><dt className="text-xs text-[var(--text-tertiary)]">渠道分类</dt><dd className="mt-2 text-2xl font-semibold">{data.categoryCount}</dd></div>
            </dl>
          </div>

          <aside className="glass-surface self-end rounded-lg p-6 lg:self-center">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div><p className="text-xs text-[var(--text-tertiary)]">编辑精选</p><h2 className="mt-1 text-xl font-semibold">今日重点</h2></div>
              <SearchCheck className="h-5 w-5 text-[var(--accent-soft)]" />
            </div>
            <div className="divide-y divide-[var(--border)]">
              {data.resources.slice(0, 3).map((resource, index) => (
                <Link key={resource.id} href={`/resource/${resource.id}`} className="group block py-5">
                  <span className="text-xs text-[var(--text-tertiary)]">0{index + 1} · {resource.category}</span>
                  <h3 className="mt-2 font-medium group-hover:text-[var(--accent-soft)]">{resource.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--text-secondary)]">{resource.description}</p>
                </Link>
              ))}
              {!data.resources.length && <p className="py-8 text-sm text-[var(--text-tertiary)]">资源正在整理中</p>}
            </div>
            <Link href="/explore" className="mt-2 inline-flex items-center gap-2 text-sm text-[var(--accent-soft)]">进入完整资源库<ArrowRight className="h-4 w-4" /></Link>
          </aside>
        </div>
      </section>

      <section className="page-container py-20">
        <div className="mb-9 flex items-end justify-between gap-5">
          <div><p className="text-sm text-[var(--accent-soft)]">经过筛选的渠道</p><h2 className="mt-2 text-3xl font-semibold md:text-4xl">热门推广资源</h2></div>
          <Link href="/explore" className="hidden items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white sm:flex">查看全部<ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <HomeFilters countries={data.countries} categories={data.categories.map((item) => item.name)} />
          <div className="grid gap-5 md:grid-cols-2 lg:col-start-1 lg:row-start-1 xl:grid-cols-3">
            {data.resources.map((resource) => <ResourceCard key={resource.id} resource={resource} animated={false} />)}
            {!data.resources.length && <div className="empty-state md:col-span-2 xl:col-span-3">暂无已上线资源</div>}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] py-20">
        <div className="page-container">
          <div className="max-w-2xl"><p className="text-sm text-[var(--accent-soft)]">资源分类</p><h2 className="mt-2 text-3xl font-semibold md:text-4xl">快速进入合适的渠道类型</h2></div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] md:grid-cols-3">
            {data.categories.slice(0, 3).map((category, index) => {
              const Icon = categoryIcons[index] ?? Globe2
              return (
                <Link key={category.name} href={`/explore?category=${encodeURIComponent(category.name)}`} className="group bg-[var(--surface)] p-7 transition-colors hover:bg-[var(--surface-elevated)]">
                  <Icon className="h-6 w-6 text-[var(--accent-soft)]" />
                  <div className="mt-10 flex items-end justify-between gap-4"><div><h3 className="text-lg font-semibold">{category.name}</h3><p className="mt-2 text-sm text-[var(--text-secondary)]">{category.count} 个已筛选资源</p></div><ArrowRight className="h-5 w-5 text-[var(--text-tertiary)] transition-transform group-hover:translate-x-1 group-hover:text-white" /></div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
