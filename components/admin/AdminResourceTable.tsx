"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, fetcher } from "@/lib/api";
import { toast } from "sonner";
import { Settings2, Plus, ArrowUpDown, MoreHorizontal, EyeOff, Eye, Trash2 } from "lucide-react";
import ResourceDrawer from "./ResourceDrawer";
import ResourceModal from "./ResourceModal";
import type { ResourceDetail } from "@/lib/types";

type Paginated = {
  data: ResourceDetail[];
  total: number;
  page: number;
  pageSize: number;
};

export default function AdminResourceTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    platform: "",
    country: "",
    status: ""
  });
  const [sort, setSort] = useState({ field: "createdAt", direction: "desc" });
  const [selected, setSelected] = useState<ResourceDetail | null>(null);
  const [showModal, setShowModal] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "8");
    params.set("sort", sort.field);
    params.set("direction", sort.direction);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [page, filters, sort]);

  const { data } = useQuery({
    queryKey: ["admin-resources", queryString],
    queryFn: () => fetcher<Paginated>(`/api/resources?${queryString}&mode=admin`)
  });

  const toggleStatus = async (resource: ResourceDetail) => {
    try {
      await api.updateResource(resource.id, {
        status: resource.status === "ACTIVE" ? "HIDDEN" : "ACTIVE"
      });
      toast.success("状态已更新");
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
    } catch {
      toast.error("更新失败");
    }
  };

  const toggleSoldOut = async (resource: ResourceDetail) => {
    try {
      await api.updateResource(resource.id, {
        status: resource.status === "SOLD_OUT" ? "ACTIVE" : "SOLD_OUT"
      });
      toast.success("售罄状态已更新");
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
    } catch {
      toast.error("更新失败");
    }
  };

  const deleteResource = async (resource: ResourceDetail) => {
    if (confirm("确定要删除此资源吗？")) {
      try {
        await api.deleteResource(resource.id);
        toast.success("资源已删除");
        queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
      } catch {
        toast.error("删除失败");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-panel/30 p-3 backdrop-blur-sm">
        <div className="flex items-center gap-2 pl-2 pr-4 text-xs font-medium text-white/50">
          <Settings2 className="h-4 w-4" />
          管理视图
        </div>
        <div className="h-5 w-px bg-white/10" />

        <input
          className="input max-w-[200px] h-9 !py-1"
          placeholder="搜索标题 / 描述"
          value={filters.q}
          onChange={(event) => setFilters({ ...filters, q: event.target.value })}
        />

        <select
          className="cursor-pointer appearance-none rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs text-white transition-all hover:bg-white/10 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-accent/50"
          value={filters.category}
          onChange={(event) => setFilters({ ...filters, category: event.target.value })}
        >
          <option value="" className="bg-panel">全部分类</option>
          <option value="家居" className="bg-panel">家居</option>
          <option value="电子" className="bg-panel">电子</option>
          <option value="服饰" className="bg-panel">服饰</option>
          <option value="美妆" className="bg-panel">美妆</option>
        </select>

        <select
          className="cursor-pointer appearance-none rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs text-white transition-all hover:bg-white/10 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-accent/50"
          value={filters.platform}
          onChange={(event) => setFilters({ ...filters, platform: event.target.value })}
        >
          <option value="" className="bg-panel">全部平台</option>
          <option value="Facebook 群组" className="bg-panel">Facebook 群组</option>
          <option value="Telegram 频道" className="bg-panel">Telegram 频道</option>
          <option value="Deal 站编辑" className="bg-panel">Deal 站编辑</option>
          <option value="TikTok 红人" className="bg-panel">TikTok 红人</option>
        </select>

        <select
          className="cursor-pointer appearance-none rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs text-white transition-all hover:bg-white/10 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-accent/50"
          value={filters.country}
          onChange={(event) => setFilters({ ...filters, country: event.target.value })}
        >
          <option value="" className="bg-panel">全部国家</option>
          <option value="美国" className="bg-panel">美国</option>
          <option value="英国" className="bg-panel">英国</option>
          <option value="德国" className="bg-panel">德国</option>
          <option value="日本" className="bg-panel">日本</option>
        </select>

        <select
          className="cursor-pointer appearance-none rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs text-white transition-all hover:bg-white/10 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-accent/50"
          value={filters.status}
          onChange={(event) => setFilters({ ...filters, status: event.target.value })}
        >
          <option value="" className="bg-panel">全部状态</option>
          <option value="ACTIVE" className="bg-panel">Active</option>
          <option value="HIDDEN" className="bg-panel">Hidden</option>
          <option value="SOLD_OUT" className="bg-panel">Sold Out</option>
        </select>

        <div className="flex items-center gap-2 ml-auto">
          <select
            className="cursor-pointer appearance-none rounded-lg border border-white/5 bg-white/5 pl-8 pr-3 py-2 text-xs text-white/70 transition-all hover:bg-white/10 hover:text-white focus:outline-none relative"
            style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: '8px center' }}
            value={`${sort.field}:${sort.direction}`}
            onChange={(event) => {
              const [field, direction] = event.target.value.split(":");
              setSort({ field, direction });
            }}
          >
            <option value="createdAt:desc" className="bg-panel">最新创建</option>
            <option value="createdAt:asc" className="bg-panel">最早创建</option>
            <option value="title:asc" className="bg-panel">标题 A-Z</option>
            <option value="title:desc" className="bg-panel">标题 Z-A</option>
          </select>
          <button className="btn-primary h-9 flex items-center gap-1 shadow-glow" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            新增资源
          </button>
        </div>
      </div>

      <div className="card overflow-hidden p-0 border-white/5 shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/5 bg-white/5 text-xs font-medium uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-6 py-4">标题</th>
              <th className="px-6 py-4">分类</th>
              <th className="px-6 py-4">平台</th>
              <th className="px-6 py-4">粉丝数</th>
              <th className="px-6 py-4">价格(¥)</th>
              <th className="px-6 py-4">国家</th>
              <th className="px-6 py-4">状态</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data?.data.map((resource) => (
              <tr key={resource.id} className="group transition-colors hover:bg-white/[0.02]">
                <td className="px-6 py-4">
                  <button className="text-left font-medium text-white/90 transition-colors hover:text-accent" onClick={() => setSelected(resource)}>
                    {resource.title}
                  </button>
                </td>
                <td className="px-6 py-4 text-white/60">
                  <span className="inline-flex rounded-md bg-white/5 px-2 py-1 text-xs">
                    {resource.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-white/60">{resource.platform}</td>
                <td className="px-6 py-4 text-white/60">
                  {resource.followers ? resource.followers.toLocaleString() : "-"}
                </td>
                <td className="px-6 py-4 text-white/60">
                  {resource.price === null || resource.price === undefined
                    ? "-"
                    : resource.price === 0
                      ? "免费"
                      : `¥${resource.price}`}
                </td>
                <td className="px-6 py-4 text-white/60">{resource.country}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wider ${
                      resource.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : resource.status === "SOLD_OUT"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-white/5 text-white/50 border border-white/10"
                    }`}
                  >
                    {resource.status === "ACTIVE" ? (
                      <Eye className="h-3 w-3" />
                    ) : resource.status === "SOLD_OUT" ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                    {resource.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/50 transition-colors hover:bg-white/10 hover:text-white" onClick={() => toggleStatus(resource)} title="切换显示">
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-md border border-amber-500/20 text-amber-400/80 transition-colors hover:bg-amber-500/10 hover:text-amber-300" onClick={() => toggleSoldOut(resource)} title="切换售罄">
                      <EyeOff className="h-4 w-4" />
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/50 transition-colors hover:bg-white/10 hover:text-white" onClick={() => setSelected(resource)} title="编辑资源">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-md border border-red-500/20 text-red-500/70 transition-colors hover:bg-red-500/10 hover:text-red-500" onClick={() => deleteResource(resource)} title="删除资源">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!data?.data?.length && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-white/40">
                    <Settings2 className="mb-3 h-8 w-8 opacity-20" />
                    <p>暂无资源记录</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-white/50 font-medium">
        <span>
          共 {data?.total ?? 0} 条资源 · 第 {data?.page ?? page} 页
        </span>
        <div className="flex gap-2">
          <button
            className="flex h-8 items-center justify-center rounded-md border border-white/10 bg-transparent px-3 transition-colors hover:bg-white/5 disabled:opacity-50"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            上一页
          </button>
          <button
            className="flex h-8 items-center justify-center rounded-md border border-white/10 bg-transparent px-3 transition-colors hover:bg-white/5"
            onClick={() => setPage((prev) => prev + 1)}
          >
            下一页
          </button>
        </div>
      </div>

      {selected && (
        <ResourceDrawer
          resource={selected}
          onClose={() => setSelected(null)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["admin-resources"] })}
        />
      )}

      {showModal && (
        <ResourceModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
