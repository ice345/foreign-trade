import { describe, expect, it } from "vitest"
import { hashVerificationCode, verificationCodeMatches } from "@/lib/verification-code"

describe("verification code hashing", () => {
  const secret = "test-secret-that-is-not-used-in-production"

  it("stores a deterministic HMAC rather than the plaintext code", () => {
    const digest = hashVerificationCode(secret, "user@example.com", "EMAIL", "123456")
    expect(digest).toMatch(/^[a-f0-9]{64}$/)
    expect(digest).not.toContain("123456")
    expect(digest).toBe(hashVerificationCode(secret, "user@example.com", "EMAIL", "123456"))
  })

  it("binds the digest to the target and verification type", () => {
    const digest = hashVerificationCode(secret, "user@example.com", "EMAIL", "123456")
    expect(digest).not.toBe(hashVerificationCode(secret, "other@example.com", "EMAIL", "123456"))
    expect(digest).not.toBe(hashVerificationCode(secret, "user@example.com", "PHONE", "123456"))
  })

  it("compares valid digests without accepting malformed values", () => {
    const digest = hashVerificationCode(secret, "user@example.com", "EMAIL", "123456")
    expect(verificationCodeMatches(digest, digest)).toBe(true)
    expect(verificationCodeMatches(digest, "bad")).toBe(false)
  })
})
