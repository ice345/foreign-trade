"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ResourceCard from "@/components/ResourceCard";
import Pagination from "@/components/Pagination";
import { api } from "@/lib/api";
import { toast } from "sonner";

const PAGE_SIZE = 12;

export default function SearchClient() {
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const query = params.get("q") ?? "";
  const [pagination, setPagination] = useState({ query, page: 1 });
  const page = pagination.query === query ? pagination.page : 1;

  const queryString = new URLSearchParams({
    ...(query && { q: query }),
    page: String(page),
    pageSize: String(PAGE_SIZE)
  }).toString();

  const { data } = useQuery({
    queryKey: ["search", query, page],
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
    setPagination({ query, page: newPage });
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
      <div className="text-xs text-white/50">共 {total} 个结果</div>
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
