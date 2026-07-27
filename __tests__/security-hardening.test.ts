import { describe, expect, it } from "vitest"
import { canReadFile } from "@/lib/file-access"
import { canAdminTransition, isTerminalOrder } from "@/lib/order-state"
import { isAllowedRequestOrigin } from "@/lib/request-security"
import { escapeHtml, isInternalFileUrl, safeJsonLd } from "@/lib/security"
import { getUploadPolicy } from "@/lib/storage-policy"

describe("browser request security", () => {
  const base = { requestOrigin: "https://globalpush.example" }

  it("allows same-origin writes", () => {
    expect(isAllowedRequestOrigin({ ...base, origin: base.requestOrigin, fetchSite: "same-origin" })).toBe(true)
  })

  it("rejects cross-site writes even when the Origin header is absent", () => {
    expect(isAllowedRequestOrigin({ ...base, origin: null, fetchSite: "cross-site" })).toBe(false)
  })

  it("allows the configured production origin", () => {
    expect(isAllowedRequestOrigin({
      ...base,
      origin: "https://www.globalpush.example",
      fetchSite: "same-site",
      configuredSiteUrl: "https://www.globalpush.example/"
    })).toBe(true)
  })
})

describe("stored file access", () => {
  const owner = { id: "owner", role: "USER" as const }
  const stranger = { id: "stranger", role: "USER" as const }
  const admin = { id: "admin", role: "ADMIN" as const }

  it("allows anyone to read public objects", () => {
    expect(canReadFile({ visibility: "PUBLIC", ownerId: owner.id }, null)).toBe(true)
  })

  it("does not expose authenticated objects anonymously", () => {
    expect(canReadFile({ visibility: "AUTHENTICATED", ownerId: null }, null)).toBe(false)
  })

  it("limits private evidence to its owner or an admin", () => {
    const file = { visibility: "OWNER_ADMIN" as const, ownerId: owner.id }
    expect(canReadFile(file, owner)).toBe(true)
    expect(canReadFile(file, admin)).toBe(true)
    expect(canReadFile(file, stranger)).toBe(false)
  })
})

describe("upload references and policies", () => {
  it("accepts only opaque app file URLs", () => {
    expect(isInternalFileUrl("/api/files/clx123abc")).toBe(true)
    expect(isInternalFileUrl("https://attacker.example/image.webp")).toBe(false)
    expect(isInternalFileUrl("/api/files/abc/../../secret")).toBe(false)
  })

  it("does not expose frozen payment upload folders", () => {
    expect(getUploadPolicy("payment-screenshots")).toBeNull()
    expect(getUploadPolicy("payment-qr")).toBeNull()
  })

  it("keeps resource and order evidence uploads admin-only", () => {
    expect(getUploadPolicy("resources")?.adminOnly).toBe(true)
    expect(getUploadPolicy("screenshots")?.visibility).toBe("OWNER_ADMIN")
  })
})

describe("injection-safe output", () => {
  it("escapes email HTML values", () => {
    expect(escapeHtml(`<img src=x onerror='x'>`)).toBe("&lt;img src=x onerror=&#39;x&#39;&gt;")
  })

  it("prevents JSON-LD script termination", () => {
    expect(safeJsonLd({ value: "</script><script>alert(1)</script>" })).not.toContain("</script>")
  })
})

describe("order state machine", () => {
  it("allows only forward admin transitions", () => {
    expect(canAdminTransition("PENDING", "QUOTED")).toBe(true)
    expect(canAdminTransition("ACCEPTED", "RUNNING")).toBe(true)
    expect(canAdminTransition("RUNNING", "PENDING")).toBe(false)
    expect(canAdminTransition("QUOTED", "REFUNDED")).toBe(false)
  })

  it("treats confirmed, cancelled and refunded as terminal", () => {
    expect(isTerminalOrder("CONFIRMED")).toBe(true)
    expect(isTerminalOrder("CANCELLED")).toBe(true)
    expect(isTerminalOrder("REFUNDED")).toBe(true)
    expect(isTerminalOrder("POSTED")).toBe(false)
  })
})
