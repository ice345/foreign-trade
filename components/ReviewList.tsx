"use client";

import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import type { ReviewItem } from "@/lib/types";
import StarRating from "@/components/StarRating";

type Props = {
  resourceId: string;
};

type ReviewResponse = {
  data: ReviewItem[];
  total: number;
  averageRating: number | null;
};

export default function ReviewList({ resourceId }: Props) {
  const { data } = useQuery<ReviewResponse>({
    queryKey: ["reviews", resourceId],
    queryFn: () => fetcher<ReviewResponse>(`/api/resources/${resourceId}/reviews`)
  });

  const reviews = data?.data ?? [];

  if (reviews.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-white/40">
        暂无评价
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const displayName = review.user.email ?? review.user.phone ?? "用户";
        const initial = displayName.charAt(0).toUpperCase();

        return (
          <div key={review.id} className="card flex gap-4 border-white/5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white/80">{displayName}</span>
                <StarRating value={review.rating} readonly size="sm" />
              </div>
              {review.comment && (
                <p className="mt-2 text-sm text-white/60">{review.comment}</p>
              )}
              <p className="mt-1 text-[10px] text-white/30">
                {new Date(review.createdAt).toLocaleDateString("zh-CN")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
