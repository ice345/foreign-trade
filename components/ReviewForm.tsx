"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import StarRating from "@/components/StarRating";

type Props = {
  resourceId: string;
  orderId: string;
};

export default function ReviewForm({ resourceId, orderId }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("请选择评分");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/resources/${resourceId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating, comment: comment || undefined })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "评价失败");
      }

      toast.success("评价成功");
      setRating(0);
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["reviews", resourceId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "评价失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 border-white/5">
      <h4 className="text-sm font-semibold">写评价</h4>
      <div>
        <label className="mb-1.5 block text-xs text-white/50">评分</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs text-white/50">评论 (选填，最多 500 字)</label>
        <textarea
          className="input min-h-[80px] w-full resize-none"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          placeholder="分享您的使用体验..."
        />
      </div>
      <button
        type="submit"
        className="btn-primary"
        disabled={submitting || rating === 0}
      >
        {submitting ? "提交中..." : "提交评价"}
      </button>
    </form>
  );
}
