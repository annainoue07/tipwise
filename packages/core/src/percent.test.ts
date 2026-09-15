import { describe, expect, it } from "vitest";
import { parsePercent } from "./percent";

describe("parsePercent", () => {
  it("parses whole percentages", () => {
    expect(parsePercent("18")).toBe(18);
    expect(parsePercent("0")).toBe(0);
    expect(parsePercent("100")).toBe(100);
  });

  it("parses up to two decimal places", () => {
    expect(parsePercent("17.5")).toBe(17.5);
    expect(parsePercent("12.25")).toBe(12.25);
  });

  it("tolerates surrounding whitespace and a trailing percent sign", () => {
    expect(parsePercent("  20  ")).toBe(20);
    expect(parsePercent("20%")).toBe(20);
    expect(parsePercent("20 %")).toBe(20);
  });

  it("allows percentages above 100 for unusual custom entries", () => {
    expect(parsePercent("150")).toBe(150);
  });

  it("rejects input it cannot interpret unambiguously", () => {
    expect(parsePercent("")).toBeNull();
    expect(parsePercent("   ")).toBeNull();
    expect(parsePercent("%")).toBeNull();
    expect(parsePercent("abc")).toBeNull();
    expect(parsePercent("18abc")).toBeNull();
    expect(parsePercent("-5")).toBeNull();
    expect(parsePercent("1.2.3")).toBeNull();
    expect(parsePercent("18.")).toBeNull();
    expect(parsePercent(".5")).toBeNull();
    expect(parsePercent("Infinity")).toBeNull();
    expect(parsePercent("NaN")).toBeNull();
  });

  it("rejects more than two decimal places rather than rounding", () => {
    expect(parsePercent("12.345")).toBeNull();
  });

  it("rejects values too large to represent exactly", () => {
    expect(parsePercent("99999999999999999")).toBeNull();
  });
});
