/**
 * Parse a user-typed tip percentage.
 *
 * Returns null rather than throwing, for the same reason as parseAmountToCents:
 * a mistyped custom tip should prompt a correction, not break the calculator.
 *
 * Accepts: "18", "17.5", "12.25", " 20 ", "20%"
 * Rejects: "", "abc", "-5", "12.345", "1.2.3", "18.", "Infinity"
 */
export function parsePercent(input: string): number | null {
  const cleaned = input.trim().replace(/%$/, "").trimEnd();

  // Same shape rule as amounts: digits with at most two decimal places.
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;

  const [whole = "0", fraction = ""] = cleaned.split(".");
  const hundredths = Number.parseInt(whole + fraction.padEnd(2, "0"), 10);

  if (!Number.isSafeInteger(hundredths)) return null;

  // Built from whole hundredths rather than parseFloat, so "17.5" becomes
  // exactly the same number as the literal 17.5 with no parsing surprises.
  return hundredths / 100;
}
