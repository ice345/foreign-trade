"use client";

import { useQuery } from "@tanstack/react-query";
import { fetcherOrNull } from "@/lib/api";
import type { UserProfile, OrderItem } from "@/lib/types";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";

type Props = {
  resourceId: string;
};

export default function ResourceReviews({ resourceId }: Props) {
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetcherOrNull<UserProfile>("/api/auth/me")
  });

  const { data: orders } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => fetcherOrNull<OrderItem[]>("/api/orders"),
    enabled: !!user
  });

  const confirmedOrder = orders?.find(
    (o) => o.resource?.id === resourceId && o.status === "CONFIRMED"
  );

  return (
    <div className="space-y-6">
      <ReviewList resourceId={resourceId} />
      {confirmedOrder && (
        <ReviewForm resourceId={resourceId} orderId={confirmedOrder.id} />
      )}
    </div>
  );
}
