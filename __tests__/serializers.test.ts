import { describe, it, expect } from "vitest";
import { serializeResource, serializeResourceSummary } from "@/lib/serializers";
import { ResourceStatus } from "@prisma/client";

const mockResource = {
  id: "res-1",
  title: "Test Resource",
  description: "A test",
  category: "Social",
  country: "US",
  platform: "Facebook",
  link: "https://example.com",
  image: null,
  price: "99.50" as unknown,
  badge: null,
  followers: 1000,
  tags: ["test"],
  status: ResourceStatus.ACTIVE,
  categoryId: null,
  createdAt: new Date("2025-01-15T10:00:00Z"),
  updatedAt: new Date("2025-01-15T10:00:00Z"),
} as any;

describe("serializeResource", () => {
  it("converts price to number", () => {
    const result = serializeResource(mockResource);
    expect(result.price).toBe(99.5);
  });

  it("converts createdAt to ISO string", () => {
    const result = serializeResource(mockResource);
    expect(result.createdAt).toBe("2025-01-15T10:00:00.000Z");
  });

  it("handles null price", () => {
    const resource = { ...mockResource, price: null };
    const result = serializeResource(resource);
    expect(result.price).toBeNull();
  });

  it("spreads all resource fields", () => {
    const result = serializeResource(mockResource);
    expect(result.id).toBe("res-1");
    expect(result.title).toBe("Test Resource");
    expect(result.status).toBe("ACTIVE");
  });
});

describe("serializeResourceSummary", () => {
  it("returns summary fields only", () => {
    const result = serializeResourceSummary(mockResource);
    expect(result).toEqual({
      id: "res-1",
      title: "Test Resource",
      description: "A test",
      category: "Social",
      country: "US",
      platform: "Facebook",
      status: "ACTIVE",
      image: null,
      price: 99.5,
      badge: null,
      followers: 1000,
    });
  });

  it("does not include tags or link", () => {
    const result = serializeResourceSummary(mockResource);
    expect(result).not.toHaveProperty("tags");
    expect(result).not.toHaveProperty("link");
    expect(result).not.toHaveProperty("createdAt");
  });
});
