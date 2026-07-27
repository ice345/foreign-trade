"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import ResourceCard from "@/components/ResourceCard";
import Pagination from "@/components/Pagination";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

const PAGE_SIZE = 12;

export default function ExploreClient() {
  const params = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const category = params.get("category") ?? "";
  const platform = params.get("platform") ?? "";
  const country = params.get("country") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";
  const leadTime = params.get("leadTime") ?? "";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const filterKey = `${category}|${platform}|${country}|${maxPrice}|${leadTime}`;

  const queryString = new URLSearchParams({
    ...(category && { category }),
    ...(platform && { platform }),
    ...(country && { country }),
    ...(maxPrice && { maxPrice }),
    ...(leadTime && { leadTime }),
    page: String(page),
    pageSize: String(PAGE_SIZE)
  }).toString();

  const { data, isError, error, isFetching } = useQuery({
    queryKey: ["resources", filterKey, page],
    queryFn: () => api.resources(`?${queryString}`)
  });

  const resources = data?.data ?? [];
  const total = data?.total ?? 0;

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites"],
    queryFn: api.favorites
  });

  const { data: cartIds = [] } = useQuery({
    queryKey: ["cartIds"],
    queryFn: api.cartIds
  });

  const handlePageChange = (newPage: number) => {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(newPage));
    router.push(`/explore?${next.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFavorite = async (id: string) => {
    try {
      await api.toggleFavorite(id);
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("收藏状态已更新");
    } catch {
      toast.error("请先登录");
    }
  };

  const handleAddToCart = async (id: string) => {
    try {
      await api.addToCart(id);
      queryClient.invalidateQueries({ queryKey: ["cartIds"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("已加入需求清单");
    } catch {
      toast.error("请先登录");
    }
  };

  return (
    <div className="space-y-6" aria-busy={isFetching}>
      <div className="flex items-center justify-between gap-3 text-xs text-white/50"><span>共 {total} 个资源</span>{isFetching && <span className="text-[var(--accent-soft)]">正在筛选...</span>}</div>
      {isError && <div role="alert" className="resource-surface border-[rgba(240,125,132,0.45)] p-5 text-sm text-[var(--danger)]">资源加载失败：{error instanceof Error ? error.message : "请刷新后重试"}</div>}
      <div className={`grid gap-6 transition-opacity md:grid-cols-2 xl:grid-cols-3 ${isFetching ? "opacity-55" : "opacity-100"}`}>
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onFavorite={toggleFavorite}
            isFavorite={favorites.includes(resource.id)}
            onAddToCart={handleAddToCart}
            inCart={cartIds.includes(resource.id)}
          />
        ))}
      </div>
      {!isError && !isFetching && !resources.length && <div className="empty-state">暂时没有符合当前筛选条件的资源</div>}
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
