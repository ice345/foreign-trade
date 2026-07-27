import { describe, expect, it } from "vitest"
import { ResourceStatus } from "@prisma/client"
import { buildResourceWhere } from "@/lib/resource-query"

const defaults = {
  q: "",
  category: "",
  platform: "",
  country: "",
  goal: "",
  maxPrice: null,
  leadTime: null,
  mode: "public",
  status: ""
}

describe("resource query builder", () => {
  it("filters public resources by the selected country", () => {
    const where = buildResourceWhere({ ...defaults, country: "美国" })

    expect(where.AND).toContainEqual({ country: "美国" })
    expect(where.AND).toContainEqual({ status: ResourceStatus.ACTIVE })
  })

  it("uses substring matching for Chinese search terms", () => {
    const where = buildResourceWhere({ ...defaults, q: "美国" })
    const queryClause = Array.isArray(where.AND) ? where.AND[0] : null

    expect(queryClause).toMatchObject({
      OR: expect.arrayContaining([
        { country: { contains: "美国", mode: "insensitive" } },
        { title: { contains: "美国", mode: "insensitive" } }
      ])
    })
  })
})
