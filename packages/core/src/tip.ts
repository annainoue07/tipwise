import { addCents, assertCents, type Cents, percentOfCents } from "./money";

export type TipInput = {
  subtotalCents: Cents;
  percent: number;
  taxCents?: Cents;
  /** A service charge already on the bill as its own line, not part of the subtotal. */
  includedGratuityCents?: Cents;
};

export type TipResult = {
  /** Always "subtotal" — carried in the result so the UI can state the base it shows. */
  base: "subtotal";
  baseCents: Cents;
  /** Tip added on top of any included gratuity. */
  tipCents: Cents;
  includedGratuityCents: Cents;
  taxCents: Cents;
  totalCents: Cents;
};

/**
 * Calculate a tip on the pre-tax subtotal.
 *
 * Tax is added to the total but never to the tip base: tipping on tax is the
 * overcharge this app exists to prevent. An included gratuity does not reduce
 * the chosen percentage — `percent` is always the additional tip the caller
 * asked for, and the combined rate is left for the UI to surface.
 */
export function calculateTip({
  subtotalCents,
  percent,
  taxCents = 0,
  includedGratuityCents = 0,
}: TipInput): TipResult {
  assertCents(taxCents);
  assertCents(includedGratuityCents);

  // percentOfCents validates the subtotal and percent, and rounds half-up.
  const tipCents = percentOfCents(subtotalCents, percent);

  return {
    base: "subtotal",
    baseCents: subtotalCents,
    tipCents,
    includedGratuityCents,
    taxCents,
    totalCents: addCents(subtotalCents, taxCents, includedGratuityCents, tipCents),
  };
}
