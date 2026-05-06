"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import type { NotificationItem } from "@/lib/types";

export default function NotificationsClient() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => api.notifications(page)
  });

  const notifications = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;
  const unreadCount = data?.unreadCount ?? 0;

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-preview"] });
  };

  const handleMarkRead = async (id: string) => {
    await api.markNotificationRead(id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-preview"] });
  };

  return (
    <div className="page-container py-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">消息通知</h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-white/50">{unreadCount} 条未读</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="btn-outline text-sm" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-1.5 h-4 w-4" />
            全部已读
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-white/50">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          加载中...
        </div>
      ) : isError ? (
        <div className="card py-16 text-center text-red-400">加载通知失败，请刷新页面重试</div>
      ) : (
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="card flex flex-col items-center py-16 text-white/40">
              <Bell className="mb-3 h-10 w-10" />
              <p>暂无通知</p>
            </div>
          ) : (
            notifications.map((n: NotificationItem) => (
              <div
                key={n.id}
                className={`card flex items-start gap-4 border-white/5 transition cursor-pointer ${
                  !n.read ? "border-l-2 border-l-accent bg-accent/5" : ""
                }`}
                onClick={() => {
                  if (!n.read) handleMarkRead(n.id);
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white/90">{n.title}</h3>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-accent" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-white/60">{n.message}</p>
                  <p className="mt-2 text-xs text-white/30">
                    {new Date(n.createdAt).toLocaleString("zh-CN")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            className="btn-outline text-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            上一页
          </button>
          <span className="text-sm text-white/50">
            {page} / {totalPages}
          </span>
          <button
            className="btn-outline text-sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
