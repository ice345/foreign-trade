import { describe, it, expect } from "vitest";
import { parsePagination } from "@/lib/pagination";

function makeParams(params: Record<string, string>) {
  return new URLSearchParams(params);
}

describe("parsePagination", () => {
  it("returns defaults when no params", () => {
    const result = parsePagination(makeParams({}));
    expect(result).toEqual({ page: 1, pageSize: 20, skip: 0, take: 20 });
  });

  it("parses page and pageSize", () => {
    const result = parsePagination(makeParams({ page: "3", pageSize: "10" }));
    expect(result).toEqual({ page: 3, pageSize: 10, skip: 20, take: 10 });
  });

  it("respects custom defaults", () => {
    const result = parsePagination(makeParams({}), { pageSize: 12 });
    expect(result).toEqual({ page: 1, pageSize: 12, skip: 0, take: 12 });
  });

  it("clamps page to minimum 1", () => {
    const result = parsePagination(makeParams({ page: "-5" }));
    expect(result.page).toBe(1);
  });

  it("clamps pageSize to minimum 1", () => {
    const result = parsePagination(makeParams({ pageSize: "0" }));
    expect(result.pageSize).toBe(1);
  });

  it("clamps pageSize to maximum 100", () => {
    const result = parsePagination(makeParams({ pageSize: "500" }));
    expect(result.pageSize).toBe(100);
  });

  it("handles non-numeric input gracefully", () => {
    const result = parsePagination(makeParams({ page: "abc" }));
    expect(result.page).toBe(1);
  });
});
