"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications-preview"],
    queryFn: () => api.notifications(1, false),
    refetchInterval: 30000
  });

  const unreadCount = data?.unreadCount ?? 0;
  const recent = data?.data.slice(0, 5) ?? [];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMarkRead = async (id: string) => {
    await api.markNotificationRead(id);
    queryClient.invalidateQueries({ queryKey: ["notifications-preview"] });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
        aria-label="通知"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-white/10 bg-panel shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <h3 className="text-sm font-semibold">通知</h3>
            <Link
              href="/notifications"
              className="text-xs text-accent hover:underline"
              onClick={() => setOpen(false)}
            >
              查看全部
            </Link>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {recent.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-white/40">
                暂无通知
              </div>
            ) : (
              recent.map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-white/5 px-4 py-3 transition hover:bg-white/5 ${
                    !n.read ? "bg-accent/5" : ""
                  }`}
                  onClick={() => {
                    if (!n.read) handleMarkRead(n.id);
                  }}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white/90">{n.title}</p>
                      <p className="mt-0.5 text-xs text-white/50 line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-[10px] text-white/30">
                        {new Date(n.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    {n.orderId && (
                      <Link
                        href="/orders"
                        className="flex-shrink-0 text-[10px] text-accent hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        查看订单
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
