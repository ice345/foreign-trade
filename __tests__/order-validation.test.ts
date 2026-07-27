import { describe, expect, it } from "vitest"
import { batchOrderSchema, createOrderSchema, updateOrderSchema } from "@/lib/validations/order"

describe("order request validation", () => {
  it("rejects non-HTTPS product links", () => {
    expect(createOrderSchema.safeParse({ resourceId: "r1", productLink: "javascript:alert(1)" }).success).toBe(false)
    expect(createOrderSchema.safeParse({ resourceId: "r1", productLink: "http://example.com" }).success).toBe(false)
  })

  it("rejects inverted date ranges and excessive text", () => {
    expect(createOrderSchema.safeParse({
      resourceId: "r1",
      startDate: "2026-08-02T00:00:00.000Z",
      endDate: "2026-08-01T00:00:00.000Z"
    }).success).toBe(false)
    expect(createOrderSchema.safeParse({ resourceId: "r1", message: "x".repeat(2001) }).success).toBe(false)
  })

  it("caps batch submissions at twenty items", () => {
    const items = Array.from({ length: 21 }, (_, index) => ({ resourceId: `r${index}` }))
    expect(batchOrderSchema.safeParse({ items }).success).toBe(false)
  })

  it("requires a positive amount when quoting", () => {
    expect(updateOrderSchema.safeParse({ status: "QUOTED" }).success).toBe(false)
    expect(updateOrderSchema.safeParse({ status: "QUOTED", amount: 0 }).success).toBe(false)
    expect(updateOrderSchema.safeParse({ status: "QUOTED", amount: 100 }).success).toBe(true)
  })

  it("rejects terminal or backward status requests at the schema boundary", () => {
    expect(updateOrderSchema.safeParse({ status: "REFUNDED" }).success).toBe(false)
    expect(updateOrderSchema.safeParse({ status: "PENDING" }).success).toBe(false)
  })
})
