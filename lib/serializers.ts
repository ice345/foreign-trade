import { Resource } from "@prisma/client";
import { toNumberOrNull } from "@/lib/decimal";

export function serializeResource(resource: Resource) {
  return {
    ...resource,
    price: toNumberOrNull(resource.price),
    createdAt: resource.createdAt.toISOString(),
  };
}

export function serializeResourceSummary(resource: Resource) {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    category: resource.category,
    country: resource.country,
    platform: resource.platform,
    status: resource.status,
    image: resource.image,
    price: toNumberOrNull(resource.price),
    badge: resource.badge,
    followers: resource.followers,
  };
}
