import { Suspense } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import HeroBackground from "@/components/HeroBackground";
import HeroButtons from "@/components/HeroButtons";
import ResourceStrip from "@/components/ResourceStrip";
import { buildMetadata, buildResourceJsonLd } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "GlobalPush · 全球资源增长引擎",
  description: "面向大陆团队的出海推广平台，聚合优惠渠道、媒体评测、返利平台与社群资源。快速筛选、收藏、运营。",
});

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GlobalPush",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://globalpush.com",
    description: "面向大陆团队的出海推广平台，聚合优惠渠道、媒体评测、返利平台与社群资源。",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="page-container py-16">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-panel/40 px-8 py-12 shadow-soft md:px-12 lg:px-16">
          <HeroBackground />
          <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
              <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_rgba(79,70,229,0.9)]" />
              GlobalPush · 全球资源增长引擎
            </div>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              海外产品推广资源库，一站式找到渠道与优惠
            </h1>
            <p className="text-base text-white/70 md:text-lg">
              面向大陆团队的出海推广平台，聚合优惠渠道、媒体评测、返利平台与社群资源。快速筛选、收藏、运营。
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-white/60">
              {["推广渠道", "优惠社群", "媒体评测", "返利平台", "联盟资源"].map((item) => (
                <span key={item} className="rounded-full border border-white/10 px-3 py-1">
                  {item}
                </span>
              ))}
            </div>
            <Suspense fallback={<div className="h-12 rounded-full bg-white/5 animate-pulse" />}>
              <SearchBar />
            </Suspense>
            <HeroButtons />
            <div className="flex flex-wrap gap-8 text-xs text-white/60">
              <div>
                <div className="text-lg font-semibold text-white">2,400+</div>
                <div>推广资源</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-white">120+</div>
                <div>渠道分类</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-white">持续更新</div>
                <div>优惠与活动</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">今日重点</h3>
                <span className="text-xs text-white/50">全球精选</span>
              </div>
              <div className="space-y-4 text-sm">
                {[
                  {
                    title: "北美优惠渠道合集",
                    desc: "覆盖优惠站点与社群渠道，适合推广活动。"
                  },
                  {
                    title: "媒体评测资源库",
                    desc: "整合海外评测、论坛与行业媒体入口。"
                  },
                  {
                    title: "返利联盟资源",
                    desc: "高转化返利平台与联盟推广资源。"
                  }
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="font-medium text-white">{item.title}</div>
                    <div className="mt-1 text-xs text-white/60">{item.desc}</div>
                  </div>
                ))}
              </div>
              <Link href="/explore" className="text-sm text-accent">
                查看全部资源 →
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="card space-y-2">
                <p className="text-xs text-white/50">收藏与提醒</p>
                <p className="text-sm text-white/70">为团队建立资源收藏夹，快速回访与共享。</p>
              </div>
              <div className="card space-y-2">
                <p className="text-xs text-white/50">可视化管理</p>
                <p className="text-sm text-white/70">后台批量维护资源状态，保持资源可运营。</p>
              </div>
            </div>
          </div>
          </div>
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-[1.5fr_0.5fr]">
          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">精选资源</p>
                <h2 className="mt-2 text-3xl font-semibold">热门推广资源推荐</h2>
              </div>
              <Link href="/explore" className="text-sm text-accent">
                查看更多 →
              </Link>
            </div>
            <Suspense fallback={<div className="h-40 rounded-2xl bg-white/5 animate-pulse" />}>
              <ResourceStrip />
            </Suspense>
          </div>
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">推荐算法面板</h3>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                Beta
              </span>
            </div>
            <p className="text-sm text-white/70">
              基于推广目标、浏览行为与资源热度，动态调整推荐顺序。
            </p>
            <div className="space-y-3 text-xs text-white/60">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                热度指数：<span className="text-white">85%</span>
                <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                  <div className="h-1.5 w-4/5 rounded-full bg-accent" />
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                类目匹配：<span className="text-white">推广渠道 · 返利联盟</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                近 7 天游走访用户：<span className="text-white">1,284</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                更新频率：<span className="text-white">每日 08:00</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                热门国家：<span className="text-white">美国 / 英国 / 日本</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                热门平台：<span className="text-white">Facebook 群组 / Deal 编辑</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                平均客单：<span className="text-white">¥268</span>
              </div>
            </div>
            <button className="btn-primary w-full">调整推荐策略</button>
          </div>
        </section>

        <section className="mt-16 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">精选栏目</p>
            <h2 className="mt-2 text-3xl font-semibold">为推广团队构建资源矩阵</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "优惠/折扣渠道",
                desc: "收录优惠站点、deal 聚合与折扣社群资源。",
                tag: "优惠"
              },
              {
                title: "媒体评测与论坛",
                desc: "海外评测媒体、论坛与内容推广入口集合。",
                tag: "媒体"
              },
              {
                title: "返利联盟平台",
                desc: "联盟推广平台与返利渠道的高转化清单。",
                tag: "联盟"
              }
            ].map((item) => (
              <div key={item.title} className="card space-y-3">
                <span className="text-xs text-accent">{item.tag}</span>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-white/60">{item.desc}</p>
                <Link href="/explore" className="text-sm text-accent">
                  进入栏目 →
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
