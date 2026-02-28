"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";
import { api } from "@/lib/api";

type FilterOption = {
  key: string;
  label: string;
  options: string[];
};

const staticFilters: FilterOption[] = [
  { key: "country", label: "国家", options: ["美国", "英国", "德国", "日本"] },
  { key: "platform", label: "平台", options: ["Facebook 群组", "Telegram 频道", "Deal 站编辑", "TikTok 红人"] }
];

export default function FilterBar() {
  const params = useSearchParams();
  const router = useRouter();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: api.categories,
    staleTime: 5 * 60 * 1000
  });

  const filters: FilterOption[] = [
    { key: "category", label: "分类", options: categories.map((c) => c.name) },
    ...staticFilters
  ];

  const updateParam = (key: string, value: string) => {
    const search = new URLSearchParams(params.toString());
    if (value) {
      search.set(key, value);
    } else {
      search.delete(key);
    }
    router.push(`/explore?${search.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/5 bg-panel/30 p-2 backdrop-blur-sm">
      <div className="flex items-center gap-2 pl-2 pr-4 text-xs font-medium text-white/50">
        <Filter className="h-3.5 w-3.5" />
        筛选
      </div>
      <div className="h-4 w-px bg-white/10" />
      {filters.map((filter) => (
        <label key={filter.key} className="flex items-center text-xs text-white/70">
          <span className="mr-2 hidden sm:inline">{filter.label}</span>
          <select
            value={params.get(filter.key) ?? ""}
            onChange={(event) => updateParam(filter.key, event.target.value)}
            className="cursor-pointer appearance-none rounded-md border border-transparent bg-white/5 px-3 py-1.5 text-xs text-white transition-all hover:bg-white/10 focus:border-white/20 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-accent/50"
          >
            <option value="" className="bg-panel text-white">全部</option>
            {filter.options.map((option) => (
              <option key={option} value={option} className="bg-panel text-white">
                {option}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
