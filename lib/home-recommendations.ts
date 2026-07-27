import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildPreferences, rankRecommendations, type RecommendationPreference } from "@/lib/recommendations"
import { serializeResourceSummary } from "@/lib/serializers"

const activeOrderStatuses = ["PENDING", "QUOTED", "ACCEPTED", "RUNNING", "POSTED", "CONFIRMED"] as const

export async function getHomeRecommendations(take = 6) {
  const session = await getSession()
  const userId = session?.userId
  const [resources, userSignals] = await Promise.all([
    prisma.resource.findMany({
      where: { status: "ACTIVE" },
      include: {
        reviews: { select: { rating: true } },
        orders: { where: { status: { in: [...activeOrderStatuses] } }, select: { status: true, createdAt: true } }
      }
    }),
    userId ? prisma.user.findUnique({
      where: { id: userId, status: "ACTIVE" },
      select: {
        orders: {
          where: { status: { in: [...activeOrderStatuses] }, resource: { isNot: null } },
          select: { status: true, resource: { select: { id: true, category: true, country: true, platform: true, tags: true } } }
        },
        favorites: { select: { resource: { select: { id: true, category: true, country: true, platform: true, tags: true } } } }
      }
    }) : Promise.resolve(null)
  ])

  const excludedIds = new Set<string>()
  const preferenceItems: RecommendationPreference[] = []
  userSignals?.orders.forEach((order) => {
    if (!order.resource) return
    excludedIds.add(order.resource.id)
    preferenceItems.push({ ...order.resource, weight: order.status === "CONFIRMED" ? 2.2 : order.status === "ACCEPTED" || order.status === "RUNNING" ? 1.8 : 1.3 })
  })
  userSignals?.favorites.forEach(({ resource }) => {
    excludedIds.add(resource.id)
    preferenceItems.push({ ...resource, weight: 1 })
  })

  // Keep the page useful for a user who has already interacted with every resource.
  const unseenCandidates = resources.filter((resource) => !excludedIds.has(resource.id))
  const candidates = unseenCandidates.length >= take ? unseenCandidates : resources
  const ranked = rankRecommendations(candidates, buildPreferences(preferenceItems), new Date(), take)
  const resourceById = new Map(resources.map((resource) => [resource.id, resource]))
  return ranked.flatMap((rank) => {
    const resource = resourceById.get(rank.id)
    if (!resource) return []
    const ratings = resource.reviews
    return [{
      ...serializeResourceSummary(resource),
      averageRating: ratings.length ? ratings.reduce((sum, review) => sum + review.rating, 0) / ratings.length : null,
      reviewCount: ratings.length,
      recommendationReason: rank.reason
    }]
  })
}
