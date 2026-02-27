"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Bookmark, MapPin, ExternalLink, Activity, Users, ShoppingCart } from "lucide-react";
import type { ResourceSummary } from "@/lib/types";
import OrderButton from "@/components/OrderButton";
import AverageRating from "@/components/AverageRating";

type Props = {
  resource: ResourceSummary;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
  onAddToCart?: (id: string) => void;
  inCart?: boolean;
  animated?: boolean;
};

export default function ResourceCard({
  resource,
  onFavorite,
  isFavorite,
  onAddToCart,
  inCart,
  animated = true
}: Props) {
  const priceLabel =
    resource.price === null || resource.price === undefined
      ? "待询价"
      : resource.price === 0
        ? "免费"
        : `¥${resource.price.toFixed(2)}`;

  const followerLabel = resource.followers
    ? resource.followers >= 10000
      ? `${(resource.followers / 10000).toFixed(1)}万`
      : resource.followers.toLocaleString()
    : "--";

  const content = (
    <>
      {resource.image ? (
        <div
          className="h-36 w-full rounded-2xl border border-white/10 bg-cover bg-center"
          style={{ backgroundImage: `url(${resource.image})` }}
        />
      ) : (
        <div className="h-36 w-full rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5" />
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
              <Activity className="h-3 w-3" />
              {resource.category}
            </span>
            {resource.status === "SOLD_OUT" ? (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">
                已售罄
              </span>
            ) : null}
            {resource.badge ? (
              <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] font-medium text-accent">
                {resource.badge}
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-lg font-semibold tracking-tight text-white/90 group-hover:text-white">
            {resource.title}
          </h3>
        </div>
        <button
          onClick={() => onFavorite?.(resource.id)}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
            isFavorite
              ? "bg-accent/20 text-accent"
              : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Bookmark className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-white/60">
        {resource.description}
      </p>
      <AverageRating rating={resource.averageRating} count={resource.reviewCount} />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/50">
            <Users className="h-3 w-3" />
            粉丝数
          </div>
          <div className="mt-2 text-lg font-semibold text-white">{followerLabel}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-right">
          <div className="text-[10px] uppercase tracking-wider text-white/50">参考价</div>
          <div className="mt-2 text-lg font-semibold text-accent">{priceLabel}</div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-4 text-xs font-medium text-white/40">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {resource.country}
        </span>
        <Link
          href={`/resource/${resource.id}`}
          className="flex items-center gap-1.5 text-accent opacity-80 transition hover:opacity-100"
        >
          查看详情
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      {onAddToCart && (
        <button
          onClick={() => onAddToCart(resource.id)}
          disabled={inCart || resource.status === "SOLD_OUT"}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            inCart
              ? "cursor-default border-accent/30 bg-accent/10 text-accent"
              : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          {inCart ? "已加入购物车" : "加入购物车"}
        </button>
      )}
      <OrderButton
        resourceId={resource.id}
        resourcePrice={resource.price ?? null}
        resourceTitle={resource.title}
        disabled={resource.status === "SOLD_OUT"}
        className="btn-primary w-full shadow-glow"
      />
    </>
  );

  if (!animated) {
    return (
      <div className="card group flex h-full flex-col gap-4 border-white/5 hover:border-white/20 hover:shadow-glow transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.01]">
        {content}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="card group flex h-full flex-col gap-4 border-white/5 hover:border-white/20 hover:shadow-glow"
    >
      {content}
    </motion.div>
  );
}
