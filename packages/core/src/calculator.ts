import { parseAmountToCents } from "./money";
import { parsePercent } from "./percent";
import { calculateTip, type TipResult } from "./tip";

/** Raw text exactly as the user typed or selected it. */
export type CalculatorInput = {
  subtotalText: string;
  taxText: string;
  percentText: string;
};

export type CalculatorError =
  | "subtotal-missing"
  | "subtotal-invalid"
  | "tax-invalid"
  | "percent-missing"
  | "percent-invalid";

export type CalculatorOutcome =
  | { ok: true; result: TipResult; percent: number }
  | { ok: false; error: CalculatorError };

/**
 * Turn the calculator's text fields into a tip result, or say which field
 * needs correcting.
 *
 * Lives in core rather than the web component so every client parses input
 * identically and the behaviour is testable without a browser. Bad input is
 * an expected state while someone is mid-typing, so it is returned, not thrown.
 */
export function calculateFromInput({
  subtotalText,
  taxText,
  percentText,
}: CalculatorInput): CalculatorOutcome {
  if (subtotalText.trim() === "") return { ok: false, error: "subtotal-missing" };
  const subtotalCents = parseAmountToCents(subtotalText);
  if (subtotalCents === null) return { ok: false, error: "subtotal-invalid" };

  // Tax is optional, but unreadable tax is an error rather than a silent $0 —
  // a mistyped tax line should be corrected, not ignored.
  const taxCents = taxText.trim() === "" ? 0 : parseAmountToCents(taxText);
  if (taxCents === null) return { ok: false, error: "tax-invalid" };

  if (percentText.trim() === "") return { ok: false, error: "percent-missing" };
  const percent = parsePercent(percentText);
  if (percent === null) return { ok: false, error: "percent-invalid" };

  return { ok: true, result: calculateTip({ subtotalCents, taxCents, percent }), percent };
}
