import { Suspense } from "react";
import ExploreClient from "./ExploreClient";
import MarketFilters from "@/components/MarketFilters";

export default function ExplorePage() {
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
          <MarketFilters />
          <ExploreClient />
        </div>
      </Suspense>
    </div>
  );
}
