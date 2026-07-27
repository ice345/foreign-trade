import { describe, expect, it } from "vitest"
import { rankRecommendations, type RecommendationCandidate } from "@/lib/recommendations"

const now = new Date("2026-07-27T12:00:00.000Z")

function candidate(overrides: Partial<RecommendationCandidate>): RecommendationCandidate {
  return {
    id: "resource",
    title: "Resource",
    category: "媒体评测",
    country: "美国",
    platform: "Editorial",
    tags: ["曝光"],
    followers: 1_000,
    leadTimeDays: 14,
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    reviews: [],
    orders: [],
    ...overrides
  }
}

describe("homepage recommendations", () => {
  it("prioritizes recent confirmed demand over a stale popularity signal", () => {
    const results = rankRecommendations([
      candidate({ id: "recent", orders: [{ status: "CONFIRMED", createdAt: new Date("2026-07-26T00:00:00.000Z") }], reviews: [{ rating: 5 }, { rating: 5 }] }),
      candidate({ id: "stale", followers: 300_000, orders: [{ status: "PENDING", createdAt: new Date("2025-01-01T00:00:00.000Z") }] })
    ], [], now)

    expect(results[0]).toMatchObject({ id: "recent", reason: "近期需求热度上升" })
  })

  it("uses past intent as a meaningful but bounded personalization signal", () => {
    const results = rankRecommendations([
      candidate({ id: "generic", followers: 30_000, category: "媒体评测", country: "英国", platform: "Editorial", tags: ["曝光"] }),
      candidate({ id: "match", followers: 1_000, category: "返利", country: "美国", platform: "Cashback", tags: ["转化", "优惠"] })
    ], [{ category: "返利", country: "美国", platform: "Cashback", tags: ["转化", "优惠"], weight: 2 }], now)

    expect(results[0]).toMatchObject({ id: "match", reason: "与你的历史需求相近" })
  })

  it("does not fill the whole recommendation shelf with one category", () => {
    const results = rankRecommendations([
      candidate({ id: "a", category: "媒体评测", orders: [{ status: "CONFIRMED", createdAt: now }] }),
      candidate({ id: "b", category: "媒体评测", orders: [{ status: "CONFIRMED", createdAt: now }] }),
      candidate({ id: "c", category: "媒体评测", orders: [{ status: "CONFIRMED", createdAt: now }] }),
      candidate({ id: "d", category: "返利", orders: [{ status: "PENDING", createdAt: now }] })
    ], [], now, 4)

    expect(results.filter((item) => item.id !== "d")).toHaveLength(2)
    expect(results.some((item) => item.id === "d")).toBe(true)
  })
})
