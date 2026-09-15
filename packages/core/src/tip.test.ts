import { describe, expect, it } from "vitest";
import { InvalidMoneyError } from "./money";
import { calculateTip } from "./tip";

describe("calculateTip", () => {
  it("calculates standard percentages on the subtotal", () => {
    expect(calculateTip({ subtotalCents: 5000, percent: 15 })).toMatchObject({
      tipCents: 750,
      totalCents: 5750,
    });
    expect(calculateTip({ subtotalCents: 2500, percent: 18 })).toMatchObject({
      tipCents: 450,
      totalCents: 2950,
    });
    expect(calculateTip({ subtotalCents: 10000, percent: 20 })).toMatchObject({
      tipCents: 2000,
      totalCents: 12000,
    });
  });

  it("rounds a half-cent tip up", () => {
    // 18% of $42.75 is exactly 769.5 cents
    expect(calculateTip({ subtotalCents: 4275, percent: 18 }).tipCents).toBe(770);
  });

  it("excludes tax from the tip base", () => {
    // 18% of the $46.40 post-tax total would be 835 cents — the overcharge
    // a terminal produces when it tips on tax.
    const result = calculateTip({ subtotalCents: 4275, taxCents: 365, percent: 18 });

    expect(result).toEqual({
      base: "subtotal",
      baseCents: 4275,
      tipCents: 770,
      includedGratuityCents: 0,
      taxCents: 365,
      totalCents: 5410,
    });
  });

  it("makes the base explicit even when no tax is given", () => {
    const result = calculateTip({ subtotalCents: 3000, percent: 20 });

    expect(result.base).toBe("subtotal");
    expect(result.baseCents).toBe(3000);
    expect(result.taxCents).toBe(0);
  });

  it("returns no tip for a zero percentage", () => {
    expect(calculateTip({ subtotalCents: 4275, taxCents: 365, percent: 0 })).toMatchObject({
      tipCents: 0,
      totalCents: 4640,
    });
  });

  it("handles a zero subtotal", () => {
    expect(calculateTip({ subtotalCents: 0, percent: 20 })).toEqual({
      base: "subtotal",
      baseCents: 0,
      tipCents: 0,
      includedGratuityCents: 0,
      taxCents: 0,
      totalCents: 0,
    });
  });

  it("reports an included gratuity and still tips the full percentage on the subtotal", () => {
    const result = calculateTip({
      subtotalCents: 10000,
      taxCents: 800,
      includedGratuityCents: 1800,
      percent: 20,
    });

    expect(result).toEqual({
      base: "subtotal",
      baseCents: 10000,
      tipCents: 2000,
      includedGratuityCents: 1800,
      taxCents: 800,
      totalCents: 14600,
    });
  });

  it("adds nothing beyond an included gratuity when the percentage is zero", () => {
    expect(
      calculateTip({ subtotalCents: 10000, includedGratuityCents: 1800, percent: 0 }),
    ).toMatchObject({ tipCents: 0, includedGratuityCents: 1800, totalCents: 11800 });
  });

  it("rejects negative or fractional amounts", () => {
    expect(() => calculateTip({ subtotalCents: -100, percent: 20 })).toThrow(InvalidMoneyError);
    expect(() => calculateTip({ subtotalCents: 10.5, percent: 20 })).toThrow(InvalidMoneyError);
    expect(() => calculateTip({ subtotalCents: 1000, taxCents: -1, percent: 20 })).toThrow(
      InvalidMoneyError,
    );
    expect(() =>
      calculateTip({ subtotalCents: 1000, includedGratuityCents: 0.5, percent: 20 }),
    ).toThrow(InvalidMoneyError);
  });

  it("rejects negative or non-finite percentages", () => {
    expect(() => calculateTip({ subtotalCents: 1000, percent: -5 })).toThrow(InvalidMoneyError);
    expect(() => calculateTip({ subtotalCents: 1000, percent: Number.NaN })).toThrow(
      InvalidMoneyError,
    );
  });
});
