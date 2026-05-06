import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    // Each test uses a unique key to avoid interference
  });

  it("allows first request", () => {
    const result = rateLimit("test-allow-1", 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.retryAfterMs).toBe(0);
  });

  it("blocks after max requests", () => {
    const key = "test-block-" + Math.random();
    for (let i = 0; i < 3; i++) {
      rateLimit(key, 3, 60000);
    }
    const result = rateLimit(key, 3, 60000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks count correctly", () => {
    const key = "test-count-" + Math.random();
    rateLimit(key, 10, 60000);
    rateLimit(key, 10, 60000);
    const result = rateLimit(key, 10, 60000);
    expect(result.allowed).toBe(true);
  });

  it("different keys are independent", () => {
    const key1 = "test-ind-1-" + Math.random();
    const key2 = "test-ind-2-" + Math.random();
    for (let i = 0; i < 5; i++) {
      rateLimit(key1, 5, 60000);
    }
    const result = rateLimit(key2, 5, 60000);
    expect(result.allowed).toBe(true);
  });
});
