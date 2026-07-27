"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetcherOrNull } from "@/lib/api";
import type { UserProfile } from "@/lib/types";
import { toast } from "sonner";
import Image from "next/image";

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
      <div className="flex items-center gap-1.5 sm:gap-3">
        <Link href="/login" className="btn-outline hidden text-xs sm:inline-flex">
          登录
        </Link>
        <Link href="/register" className="btn text-xs">
          注册
        </Link>
      </div>
    );
  }

  const displayName = user.nickname || user.email || user.phone;
  const initial = (displayName ?? "U").charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 text-xs text-white/70">
      <Link href="/profile/settings" className="flex items-center gap-2">
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-full object-cover border border-white/10"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
            {initial}
          </span>
        )}
        <span className="hidden md:inline">{displayName}</span>
      </Link>
      <button className="btn text-xs" onClick={logout}>
        退出
      </button>
    </div>
  );
}
