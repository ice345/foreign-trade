"use client";

import { useQuery } from "@tanstack/react-query";
import ResourceCard from "@/components/ResourceCard";
import { api } from "@/lib/api";

export default function ResourceStrip() {
  const { data } = useQuery({
    queryKey: ["home-resources"],
    queryFn: () => api.resources("?page=1&pageSize=8"),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const resources = data?.data ?? [];

  if (!resources.length) {
    return <div className="text-sm text-white/50">暂无资源数据</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {resources.map((resource) => (
        <ResourceCard key={resource.id} resource={resource} animated={false} />
      ))}
    </div>
  );
}
