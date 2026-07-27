import { describe, expect, it } from "vitest"
import { parseOptionalLeadTime, parseOptionalMaxPrice } from "@/lib/resource-filters"

describe("resource query filters", () => {
  it("does not turn an absent price filter into a zero-price filter", () => {
    expect(parseOptionalMaxPrice(null)).toBeNull()
    expect(parseOptionalMaxPrice("")).toBeNull()
    expect(parseOptionalMaxPrice("5000")).toBe(5000)
  })

  it("rejects invalid bounds and safely limits valid values", () => {
    expect(parseOptionalMaxPrice("-1")).toBeNull()
    expect(parseOptionalMaxPrice("10000001")).toBe(10_000_000)
    expect(parseOptionalLeadTime(null)).toBeNull()
    expect(parseOptionalLeadTime("14.9")).toBe(14)
    expect(parseOptionalLeadTime("0")).toBeNull()
  })
})
