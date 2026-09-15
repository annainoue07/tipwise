import { describe, expect, it } from "vitest";
import { calculateFromInput } from "./calculator";

describe("calculateFromInput", () => {
  it("produces a correct total for each preset percentage", () => {
    const totals = [10, 15, 18, 20, 25].map((percent) => {
      const outcome = calculateFromInput({
        subtotalText: "100.00",
        taxText: "",
        percentText: String(percent),
      });
      return outcome.ok ? outcome.result.totalCents : null;
    });

    expect(totals).toEqual([11000, 11500, 11800, 12000, 12500]);
  });

  it("calculates the tip on the subtotal and adds tax only to the total", () => {
    // 18% of the $46.40 post-tax total would be 835 cents.
    const outcome = calculateFromInput({
      subtotalText: "$42.75",
      taxText: "3.65",
      percentText: "18",
    });

    expect(outcome).toEqual({
      ok: true,
      percent: 18,
      result: {
        base: "subtotal",
        baseCents: 4275,
        tipCents: 770,
        includedGratuityCents: 0,
        taxCents: 365,
        totalCents: 5410,
      },
    });
  });

  it("accepts a custom decimal percentage", () => {
    const outcome = calculateFromInput({
      subtotalText: "100",
      taxText: "",
      percentText: "17.5",
    });

    expect(outcome).toMatchObject({ ok: true, percent: 17.5, result: { tipCents: 1750 } });
  });

  it("rounds a two-decimal custom percentage that lands exactly on a half-cent", () => {
    // 10.04% of $12.50 is exactly 125.5 cents.
    const outcome = calculateFromInput({
      subtotalText: "12.50",
      taxText: "",
      percentText: "10.04",
    });

    expect(outcome).toMatchObject({ ok: true, result: { tipCents: 126, totalCents: 1376 } });
  });

  it("treats blank tax as zero", () => {
    const outcome = calculateFromInput({ subtotalText: "50", taxText: "   ", percentText: "20" });

    expect(outcome).toMatchObject({ ok: true, result: { taxCents: 0, totalCents: 6000 } });
  });

  it("handles a zero subtotal", () => {
    const outcome = calculateFromInput({ subtotalText: "0", taxText: "", percentText: "20" });

    expect(outcome).toMatchObject({ ok: true, result: { tipCents: 0, totalCents: 0 } });
  });

  it("reports a missing subtotal", () => {
    expect(calculateFromInput({ subtotalText: "", taxText: "", percentText: "18" })).toEqual({
      ok: false,
      error: "subtotal-missing",
    });
    expect(calculateFromInput({ subtotalText: "  ", taxText: "", percentText: "18" })).toEqual({
      ok: false,
      error: "subtotal-missing",
    });
  });

  it("reports an unreadable subtotal instead of producing NaN", () => {
    for (const subtotalText of ["abc", "12.345", "-5", "1.2.3"]) {
      expect(calculateFromInput({ subtotalText, taxText: "", percentText: "18" })).toEqual({
        ok: false,
        error: "subtotal-invalid",
      });
    }
  });

  it("reports unreadable tax rather than silently treating it as zero", () => {
    expect(calculateFromInput({ subtotalText: "50", taxText: "abc", percentText: "18" })).toEqual({
      ok: false,
      error: "tax-invalid",
    });
  });

  it("reports a missing or unreadable percentage", () => {
    expect(calculateFromInput({ subtotalText: "50", taxText: "", percentText: "" })).toEqual({
      ok: false,
      error: "percent-missing",
    });
    for (const percentText of ["abc", "-5", "12.345"]) {
      expect(calculateFromInput({ subtotalText: "50", taxText: "", percentText })).toEqual({
        ok: false,
        error: "percent-invalid",
      });
    }
  });

  it("reports the subtotal first when several fields are wrong", () => {
    expect(calculateFromInput({ subtotalText: "abc", taxText: "abc", percentText: "abc" })).toEqual(
      { ok: false, error: "subtotal-invalid" },
    );
  });
});
