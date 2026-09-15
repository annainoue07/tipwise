/**
 * Money handling for TipWise.
 *
 * Every monetary value in this codebase is an integer number of cents.
 * Floating-point dollars are never stored, passed, or calculated with —
 * `0.1 + 0.2 !== 0.3` is not an acceptable property for a bill total.
 *
 * Conversion to a human-readable string happens once, at the UI boundary.
 */

/** An integer number of cents. Never fractional, never a dollar amount. */
export type Cents = number;

/** Thrown when a value that must be integer cents is not. */
export class InvalidMoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidMoneyError";
  }
}

/** Narrow an arbitrary number to Cents, rejecting anything unusable. */
export function assertCents(value: number): asserts value is Cents {
  if (!Number.isFinite(value)) {
    throw new InvalidMoneyError(`Expected a finite amount, received ${value}`);
  }
  if (!Number.isInteger(value)) {
    throw new InvalidMoneyError(`Expected whole cents, received ${value}`);
  }
  if (value < 0) {
    throw new InvalidMoneyError(`Expected a non-negative amount, received ${value}`);
  }
}

/**
 * Parse user-typed or OCR-extracted text into cents.
 *
 * Returns null rather than throwing, because bad input here is expected:
 * a user mistypes, or a vision model misreads a crumpled receipt. Callers
 * should surface a correction prompt, not an error page.
 *
 * Accepts: "12.34", "$12.34", "1,234.56", "12", " 12.3 "
 * Rejects: "", "abc", "-5", "12.345", "1.2.3"
 */
export function parseAmountToCents(input: string): Cents | null {
  const cleaned = input.trim().replace(/[$\s,]/g, "");
  if (cleaned === "") return null;

  // Digits, with at most two decimal places. Anything else is ambiguous
  // enough that guessing would be worse than asking the user.
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;

  const [whole = "0", fraction = ""] = cleaned.split(".");
  const paddedFraction = fraction.padEnd(2, "0");

  const dollars = Number.parseInt(whole, 10);
  const cents = Number.parseInt(paddedFraction, 10);

  if (!Number.isSafeInteger(dollars)) return null;

  return dollars * 100 + cents;
}

/**
 * Take a percentage of an amount, rounding half away from zero.
 *
 * Rounding is explicit because tips land on half-cents routinely:
 * 18% of $42.75 is 769.5 cents, and silently truncating would
 * consistently shortchange by design.
 *
 * The percent is resolved to whole hundredths first so the rounding decision
 * is made on an exact integer. Multiplying by a float like 10.04 directly
 * lands a hair below a true half-cent (1250 × 10.04 / 100 is 125.4999…) and
 * rounds the wrong way. Percents finer than hundredths are rounded to the
 * nearest hundredth.
 */
export function percentOfCents(amount: Cents, percent: number): Cents {
  assertCents(amount);
  if (!Number.isFinite(percent) || percent < 0) {
    throw new InvalidMoneyError(`Expected a non-negative percent, received ${percent}`);
  }

  const hundredthsOfPercent = Math.round(percent * 100);
  // amount × hundredths is the tip in 1/10000ths of a cent; adding half a
  // cent's worth before flooring rounds half up.
  return Math.floor((amount * hundredthsOfPercent + 5000) / 10000);
}

/** Add amounts. Variadic so totals read naturally at call sites. */
export function addCents(...amounts: Cents[]): Cents {
  let total = 0;
  for (const amount of amounts) {
    assertCents(amount);
    total += amount;
  }
  return total;
}

/** Subtract b from a. Throws if the result would be negative. */
export function subtractCents(a: Cents, b: Cents): Cents {
  assertCents(a);
  assertCents(b);
  const result = a - b;
  if (result < 0) {
    throw new InvalidMoneyError(`Subtraction would produce a negative amount: ${a} - ${b}`);
  }
  return result;
}

/**
 * Format cents for display. The only place dollars exist as a concept.
 */
export function formatCents(amount: Cents, locale = "en-US", currency = "USD"): string {
  assertCents(amount);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount / 100);
}

/**
 * What percentage one amount is of another, to one decimal place.
 *
 * Used to show the user the effective tip rate when they enter a custom
 * total — the "you are tipping 31%" moment this app exists to surface.
 * Returns null for a zero base rather than Infinity.
 */
export function percentageOfCents(part: Cents, whole: Cents): number | null {
  assertCents(part);
  assertCents(whole);
  if (whole === 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}
