import { Prisma, ResourceStatus } from "@prisma/client"

type ResourceQueryFilters = {
  q: string
  category: string
  platform: string
  country: string
  goal: string
  maxPrice: number | null
  leadTime: number | null
  mode: string
  status: string
}

export function buildResourceWhere(filters: ResourceQueryFilters): Prisma.ResourceWhereInput {
  const { q, category, platform, country, goal, maxPrice, leadTime, mode, status } = filters

  return {
    AND: [
      q ? { OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { country: { contains: q, mode: "insensitive" } },
        { platform: { contains: q, mode: "insensitive" } },
        { tags: { has: q } }
      ] } : {},
      category ? { category } : {},
      platform ? { platform } : {},
      country ? { country } : {},
      goal ? { OR: [
        { category: { contains: goal, mode: "insensitive" } },
        { description: { contains: goal, mode: "insensitive" } },
        { tags: { has: goal } }
      ] } : {},
      maxPrice !== null ? { OR: [{ price: null }, { price: { lte: maxPrice } }] } : {},
      leadTime !== null ? { OR: [{ leadTimeDays: null }, { leadTimeDays: { lte: leadTime } }] } : {},
      status
        ? { status: status as ResourceStatus }
        : mode === "public"
          ? { status: ResourceStatus.ACTIVE }
          : {}
    ]
  }
}
