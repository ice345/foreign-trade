"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, fetcherOrNull } from "@/lib/api";
import type { ResourceSummary } from "@/lib/types";
import ResourceCard from "@/components/ResourceCard";
import { toast } from "sonner";

type FavoriteResponse = {
  resources: ResourceSummary[];
};

export default function ProfileClient() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["favorites", "resources"],
    queryFn: () => fetcherOrNull<FavoriteResponse>("/api/favorites?include=resources")
  });

  if (!data) {
    return <p className="text-sm text-white/60">请先登录以查看收藏。</p>;
  }

  if (!data.resources?.length) {
    return <p className="text-sm text-white/60">暂无收藏资源。</p>;
  }

  const handleToggle = async (id: string) => {
    try {
      await api.toggleFavorite(id);
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("已取消收藏");
    } catch {
      toast.error("操作失败");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {data.resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          isFavorite={true}
          onFavorite={handleToggle}
        />
      ))}
    </div>
  );
}
