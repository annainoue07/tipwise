import { describe, expect, it } from "vitest";
import {
  addCents,
  assertCents,
  formatCents,
  InvalidMoneyError,
  parseAmountToCents,
  percentageOfCents,
  percentOfCents,
  subtractCents,
} from "./money";

describe("parseAmountToCents", () => {
  it("parses plain decimal amounts", () => {
    expect(parseAmountToCents("12.34")).toBe(1234);
    expect(parseAmountToCents("0.99")).toBe(99);
    expect(parseAmountToCents("100.00")).toBe(10000);
  });

  it("parses whole dollars without a decimal point", () => {
    expect(parseAmountToCents("12")).toBe(1200);
    expect(parseAmountToCents("0")).toBe(0);
  });

  it("pads a single decimal place", () => {
    // "12.3" means twelve dollars thirty cents, not twelve dollars three cents
    expect(parseAmountToCents("12.3")).toBe(1230);
  });

  it("strips currency symbols, commas, and surrounding whitespace", () => {
    expect(parseAmountToCents("$12.34")).toBe(1234);
    expect(parseAmountToCents("1,234.56")).toBe(123456);
    expect(parseAmountToCents("  42.00  ")).toBe(4200);
    expect(parseAmountToCents("$1,234")).toBe(123400);
  });

  it("rejects input it cannot interpret unambiguously", () => {
    expect(parseAmountToCents("")).toBeNull();
    expect(parseAmountToCents("   ")).toBeNull();
    expect(parseAmountToCents("abc")).toBeNull();
    expect(parseAmountToCents("-5.00")).toBeNull();
    expect(parseAmountToCents("1.2.3")).toBeNull();
  });

  it("rejects more than two decimal places rather than guessing", () => {
    // A vision model misreading "12.34" as "12.345" should trigger a
    // correction prompt, not a silently rounded total.
    expect(parseAmountToCents("12.345")).toBeNull();
  });

  it("avoids floating-point drift on amounts that break naive parsing", () => {
    // 0.1 + 0.2 territory. parseFloat("19.99") * 100 is 1998.9999...
    expect(parseAmountToCents("19.99")).toBe(1999);
    expect(parseAmountToCents("0.07")).toBe(7);
    expect(parseAmountToCents("8.05")).toBe(805);
  });
});

describe("percentOfCents", () => {
  it("calculates common tip percentages", () => {
    expect(percentOfCents(10000, 20)).toBe(2000);
    expect(percentOfCents(5000, 15)).toBe(750);
    expect(percentOfCents(2500, 18)).toBe(450);
  });

  it("rounds half away from zero on fractional cents", () => {
    // 18% of $42.75 is exactly 769.5 cents
    expect(percentOfCents(4275, 18)).toBe(770);
  });

  it("rounds exact half-cents up for two-decimal percentages", () => {
    // Float multiplication puts each of these a hair below .5 (1250 * 10.04
    // / 100 is 125.4999...), which rounded them down before integer math.
    expect(percentOfCents(1250, 10.04)).toBe(126);
    expect(percentOfCents(25000, 10.03)).toBe(2508);
    expect(percentOfCents(6250, 10.04)).toBe(628);
  });

  it("handles zero on both sides", () => {
    expect(percentOfCents(0, 20)).toBe(0);
    expect(percentOfCents(5000, 0)).toBe(0);
  });

  it("supports percentages above 100 for unusual custom entries", () => {
    expect(percentOfCents(1000, 150)).toBe(1500);
  });

  it("rejects negative or non-finite percentages", () => {
    expect(() => percentOfCents(1000, -5)).toThrow(InvalidMoneyError);
    expect(() => percentOfCents(1000, Number.NaN)).toThrow(InvalidMoneyError);
  });

  it("rejects a fractional-cent base amount", () => {
    expect(() => percentOfCents(10.5, 20)).toThrow(InvalidMoneyError);
  });
});

describe("addCents and subtractCents", () => {
  it("adds amounts without drift", () => {
    expect(addCents(1999, 165, 400)).toBe(2564);
    expect(addCents()).toBe(0);
  });

  it("subtracts tax from a total to recover the subtotal", () => {
    // The core of "do not tip on tax": total 46.40, tax 3.65
    expect(subtractCents(4640, 365)).toBe(4275);
  });

  it("refuses to produce a negative amount", () => {
    expect(() => subtractCents(100, 500)).toThrow(InvalidMoneyError);
  });
});

describe("percentageOfCents", () => {
  it("reports the effective rate to one decimal place", () => {
    expect(percentageOfCents(770, 4275)).toBe(18);
    expect(percentageOfCents(2000, 10000)).toBe(20);
  });

  it("surfaces an unexpectedly high effective rate", () => {
    // The scenario the product exists for: a terminal suggesting a tip
    // calculated on the post-tax total rather than the subtotal.
    expect(percentageOfCents(1392, 4275)).toBe(32.6);
  });

  it("returns null for a zero base instead of Infinity", () => {
    expect(percentageOfCents(500, 0)).toBeNull();
  });
});

describe("formatCents", () => {
  it("formats US dollars", () => {
    expect(formatCents(1234)).toBe("$12.34");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(100000)).toBe("$1,000.00");
  });

  it("always shows two decimal places", () => {
    expect(formatCents(500)).toBe("$5.00");
    expect(formatCents(505)).toBe("$5.05");
  });
});

describe("assertCents", () => {
  it("accepts non-negative integers", () => {
    expect(() => assertCents(0)).not.toThrow();
    expect(() => assertCents(12345)).not.toThrow();
  });

  it("rejects fractional, negative, and non-finite values", () => {
    expect(() => assertCents(12.5)).toThrow(InvalidMoneyError);
    expect(() => assertCents(-1)).toThrow(InvalidMoneyError);
    expect(() => assertCents(Number.NaN)).toThrow(InvalidMoneyError);
    expect(() => assertCents(Number.POSITIVE_INFINITY)).toThrow(InvalidMoneyError);
  });
});
