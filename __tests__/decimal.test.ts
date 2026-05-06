import { describe, it, expect } from "vitest";
import { toNumber, toNumberOrNull, formatMoney } from "@/lib/decimal";

describe("toNumber", () => {
  it("returns 0 for null", () => {
    expect(toNumber(null)).toBe(0);
  });

  it("returns 0 for undefined", () => {
    expect(toNumber(undefined)).toBe(0);
  });

  it("converts number", () => {
    expect(toNumber(42)).toBe(42);
  });

  it("converts string", () => {
    expect(toNumber("3.14")).toBe(3.14);
  });

  it("converts 0", () => {
    expect(toNumber(0)).toBe(0);
  });
});

describe("toNumberOrNull", () => {
  it("returns null for null", () => {
    expect(toNumberOrNull(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(toNumberOrNull(undefined)).toBeNull();
  });

  it("converts number", () => {
    expect(toNumberOrNull(99.5)).toBe(99.5);
  });

  it("converts string", () => {
    expect(toNumberOrNull("12.34")).toBe(12.34);
  });
});

describe("formatMoney", () => {
  it("returns '0.00' for null", () => {
    expect(formatMoney(null)).toBe("0.00");
  });

  it("returns '0.00' for undefined", () => {
    expect(formatMoney(undefined)).toBe("0.00");
  });

  it("formats number to 2 decimal places", () => {
    expect(formatMoney(100)).toBe("100.00");
  });

  it("formats string", () => {
    expect(formatMoney("50.5")).toBe("50.50");
  });

  it("rounds to 2 decimals", () => {
    expect(formatMoney(99.999)).toBe("100.00");
  });
});
