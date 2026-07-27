"use client"

import Image from "next/image"
import Link from "next/link"
import { Bookmark, Clock3, MapPin, Sparkles, ShoppingCart, Users } from "lucide-react"
import type { ResourceSummary } from "@/lib/types"
import OrderButton from "@/components/OrderButton"
import AverageRating from "@/components/AverageRating"

type Props = {
  resource: ResourceSummary
  onFavorite?: (id: string) => void
  isFavorite?: boolean
  onAddToCart?: (id: string) => void
  inCart?: boolean
  animated?: boolean
}

export default function ResourceCard({
  resource,
  onFavorite,
  isFavorite,
  onAddToCart,
  inCart
}: Props) {
  const price = resource.price == null ? "待询价" : resource.price === 0 ? "免费" : `¥${resource.price.toFixed(0)}`
  const followers = resource.followers
    ? resource.followers >= 10_000 ? `${(resource.followers / 10_000).toFixed(1)}万` : resource.followers.toLocaleString()
    : "--"

  return (
    <article className="resource-card resource-surface group flex h-full flex-col overflow-hidden">
      <div className="resource-card-media relative aspect-[16/8.5] overflow-hidden bg-[#e9edf3]">
        {resource.image ? (
          <Image src={resource.image} alt={`${resource.title} 平台标识`} fill sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw" className="object-contain p-6" />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl font-semibold text-[#2b3340]">
            {resource.title.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-[var(--accent-soft)]">{resource.category}</p>
            <h3 className="mt-1 truncate text-lg font-semibold">{resource.title}</h3>
          </div>
          {onFavorite && (
            <button onClick={() => onFavorite(resource.id)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-white/5 hover:text-white" aria-label={isFavorite ? "取消收藏" : "收藏资源"}>
              <Bookmark className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
            </button>
          )}
        </div>

        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-[var(--text-secondary)]">{resource.description}</p>
        {resource.recommendationReason && (
          <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--accent-muted)] px-2.5 py-1 text-xs text-[var(--accent-soft)]">
            <Sparkles className="h-3 w-3" />{resource.recommendationReason}
          </p>
        )}
        <div className="mt-3"><AverageRating rating={resource.averageRating} count={resource.reviewCount} /></div>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-[var(--border)] py-4 text-xs">
          <div>
            <dt className="flex items-center gap-1.5 text-[var(--text-tertiary)]"><Users className="h-3.5 w-3.5" />受众规模</dt>
            <dd className="mt-1 text-sm font-medium text-[var(--text-primary)]">{followers}</dd>
          </div>
          <div className="text-right">
            <dt className="text-[var(--text-tertiary)]">参考价格</dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--accent-soft)]">{price}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-[var(--text-tertiary)]"><MapPin className="h-3.5 w-3.5" />服务地区</dt>
            <dd className="mt-1 text-sm text-[var(--text-secondary)]">{resource.country}</dd>
          </div>
          <div className="text-right">
            <dt className="flex items-center justify-end gap-1.5 text-[var(--text-tertiary)]"><Clock3 className="h-3.5 w-3.5" />预计周期</dt>
            <dd className="mt-1 text-sm text-[var(--text-secondary)]">{resource.leadTimeDays ? `${resource.leadTimeDays} 天` : "待确认"}</dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <Link href={`/resource/${resource.id}`} className="text-sm font-medium text-[var(--accent-soft)] hover:text-white">查看详情</Link>
          {onAddToCart && (
            <button onClick={() => onAddToCart(resource.id)} disabled={inCart || resource.status === "SOLD_OUT"} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-white/5" aria-label={inCart ? "已加入清单" : "加入清单"}>
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="resource-card-action mt-3">
          <OrderButton resourceId={resource.id} resourcePrice={resource.price} resourceTitle={resource.title} disabled={resource.status === "SOLD_OUT"} className="btn-primary w-full" label="提交推广需求" />
        </div>
      </div>
    </article>
  )
}
