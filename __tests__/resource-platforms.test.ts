import { describe, expect, it } from "vitest"
import { RESOURCE_PLATFORMS, resourcePlatformOptions } from "@/lib/resource-platforms"

describe("resource platforms", () => {
  it("uses platform names instead of platform and channel combinations", () => {
    expect(RESOURCE_PLATFORMS).toContain("Reddit")
    expect(RESOURCE_PLATFORMS).toContain("Facebook")
    expect(RESOURCE_PLATFORMS).toContain("Telegram")
    expect(RESOURCE_PLATFORMS).not.toContain("Facebook 群组")
    expect(RESOURCE_PLATFORMS).not.toContain("Telegram 频道")
  })

  it("preserves a legacy value while an existing resource is being edited", () => {
    expect(resourcePlatformOptions("Custom Network")[0]).toBe("Custom Network")
  })
})
