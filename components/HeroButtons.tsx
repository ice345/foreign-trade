"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { fetcherOrNull } from "@/lib/api"
import type { UserProfile } from "@/lib/types"

export default function HeroButtons() {
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetcherOrNull<UserProfile>("/api/auth/me")
  })

  return (
    <div className="flex flex-wrap gap-4">
      <Link href="/explore" className="btn-primary">
        开始探索
      </Link>
      {user?.role === "ADMIN" && (
        <Link href="/admin/resources" className="btn-outline">
          进入管理后台
        </Link>
      )}
    </div>
  )
}
