"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ResourceCard from "@/components/ResourceCard";
import Pagination from "@/components/Pagination";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

const PAGE_SIZE = 12;

export default function ExploreClient() {
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const category = params.get("category") ?? "";
  const platform = params.get("platform") ?? "";
  const country = params.get("country") ?? "";
  const filterKey = `${category}|${platform}|${country}`;

  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  const queryString = new URLSearchParams({
    ...(category && { category }),
    ...(platform && { platform }),
    ...(country && { country }),
    page: String(page),
    pageSize: String(PAGE_SIZE)
  }).toString();

  const { data } = useQuery({
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
    setPage(newPage);
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
      toast.success("已加入购物车");
    } catch {
      toast.error("请先登录");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-xs text-white/50">共 {total} 个资源</div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
