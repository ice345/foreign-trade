import { describe, expect, it } from "vitest"
import { buildExploreFilterUrl } from "@/lib/explore-filters"

describe("explore filter navigation", () => {
  it("resets pagination whenever a filter changes", () => {
    const current = new URLSearchParams("page=3&category=电子")
    expect(buildExploreFilterUrl(current, "country", "美国")).toBe("/explore?category=%E7%94%B5%E5%AD%90&country=%E7%BE%8E%E5%9B%BD")
  })

  it("toggles an active filter off without leaving a dangling query", () => {
    expect(buildExploreFilterUrl(new URLSearchParams("country=美国&page=2"), "country", "美国")).toBe("/explore")
  })
})
