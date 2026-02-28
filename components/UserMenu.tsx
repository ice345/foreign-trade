"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetcherOrNull } from "@/lib/api";
import type { UserProfile } from "@/lib/types";
import { toast } from "sonner";

export default function UserMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetcherOrNull<UserProfile>("/api/auth/me")
  });

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.setQueryData(["me"], null);
    toast.success("已退出登录");
    router.push("/");
    router.refresh();
  };

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className="btn-outline text-xs">
          登录
        </Link>
        <Link href="/register" className="btn text-xs">
          注册
        </Link>
      </div>
    );
  }

  const displayName = user.nickname || user.email || user.phone;

  return (
    <div className="flex items-center gap-3 text-xs text-white/70">
      <span className="hidden md:inline">{displayName}</span>
      <Link href="/profile/settings" className="btn-outline text-xs">
        设置
      </Link>
      <button className="btn text-xs" onClick={logout}>
        退出
      </button>
    </div>
  );
}
