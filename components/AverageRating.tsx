"use client";

import { Star } from "lucide-react";

type Props = {
  rating: number | null | undefined;
  count: number | undefined;
};

export default function AverageRating({ rating, count }: Props) {
  if (!rating || !count) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-white/50">
      <span className="font-medium text-yellow-400">{rating.toFixed(1)}</span>
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      <span>({count} 条评价)</span>
    </div>
  );
}
