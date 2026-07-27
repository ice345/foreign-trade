import { Suspense } from "react";
import ExploreClient from "./ExploreClient";
import MarketFilters from "@/components/MarketFilters";
import { buildMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "资源探索 — GlobalPush",
  description: "浏览海外推广渠道、媒体评测、返利平台与优惠资源，支持按国家、平台、类目筛选。",
});

async function getFacets() {
  try {
    const resources = await prisma.resource.findMany({
      where: { status: "ACTIVE" },
      select: { country: true, platform: true, category: true }
    });
    return {
      countries: [...new Set(resources.map((item) => item.country))].sort(),
      platforms: [...new Set(resources.map((item) => item.platform))].sort(),
      categories: [...new Set(resources.map((item) => item.category))].sort()
    };
  } catch (error) {
    console.error("[Explore Facets Error]", error);
    return { countries: [], platforms: [], categories: [] };
  }
}

export default async function ExplorePage() {
  const facets = await getFacets();
  return (
    <div className="page-container py-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">资源探索</h1>
          <p className="text-sm text-white/60">浏览海外推广渠道、媒体评测与优惠资源。</p>
        </div>
        <span className="text-xs text-muted">支持国家 / 平台 / 类目筛选</span>
      </div>
      <Suspense fallback={<div className="text-white/60">加载中...</div>}>
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <MarketFilters facets={facets} />
          <ExploreClient />
        </div>
      </Suspense>
    </div>
  );
}
