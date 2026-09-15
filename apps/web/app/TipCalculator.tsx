"use client";

import { type CalculatorError, calculateFromInput, formatCents } from "@tipwise/core";
import { useId, useState } from "react";

const TIP_PRESETS = [10, 15, 18, 20, 25] as const;

type TipChoice = { kind: "preset"; percent: number } | { kind: "custom"; text: string } | null;

const ERROR_MESSAGES: Record<CalculatorError, string> = {
  "subtotal-missing": "Enter the subtotal from your bill to see the tip.",
  "subtotal-invalid": "Enter the subtotal as an amount, like 42.75.",
  "tax-invalid": "Enter the tax as an amount, like 3.65, or leave it blank.",
  "percent-missing": "Choose a tip percentage.",
  "percent-invalid": "Enter a tip percentage, like 18 or 17.5.",
};

export function TipCalculator() {
  const subtotalId = useId();
  const taxId = useId();
  const customId = useId();

  const [subtotalText, setSubtotalText] = useState("");
  const [taxText, setTaxText] = useState("");
  const [choice, setChoice] = useState<TipChoice>(null);

  const percentText =
    choice === null ? "" : choice.kind === "preset" ? String(choice.percent) : choice.text;
  const outcome = calculateFromInput({ subtotalText, taxText, percentText });
  const error = outcome.ok ? null : outcome.error;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <AmountField
          id={subtotalId}
          label="Subtotal"
          value={subtotalText}
          onChange={setSubtotalText}
          invalid={error === "subtotal-invalid"}
        />
        <AmountField
          id={taxId}
          label="Tax (optional)"
          value={taxText}
          onChange={setTaxText}
          invalid={error === "tax-invalid"}
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-base font-medium">Tip</legend>
        <div className="grid grid-cols-5 gap-2">
          {TIP_PRESETS.map((percent) => {
            const selected = choice?.kind === "preset" && choice.percent === percent;
            return (
              <button
                key={percent}
                type="button"
                aria-pressed={selected}
                onClick={() => setChoice({ kind: "preset", percent })}
                className={`min-h-11 rounded-lg border text-base font-medium ${
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-zinc-400 dark:border-zinc-600"
                }`}
              >
                {percent}%
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor={customId} className="text-base">
            Custom %
          </label>
          <input
            id={customId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="e.g. 17.5"
            value={choice?.kind === "custom" ? choice.text : ""}
            onChange={(event) => setChoice({ kind: "custom", text: event.target.value })}
            aria-invalid={error === "percent-invalid"}
            className={`min-h-11 w-full min-w-0 rounded-lg border bg-transparent px-3 text-base ${
              error === "percent-invalid"
                ? "border-red-700 dark:border-red-400"
                : "border-zinc-400 dark:border-zinc-600"
            }`}
          />
        </div>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Tips are calculated on the subtotal, before tax.
        </p>
      </fieldset>

      <section
        aria-live="polite"
        className="rounded-xl border border-zinc-300 p-4 dark:border-zinc-700"
      >
        {outcome.ok ? (
          <div className="flex flex-col gap-2 text-base">
            <dl className="flex flex-col gap-2">
              <Row label="Subtotal" value={formatCents(outcome.result.baseCents)} />
              <Row label="Tax" value={formatCents(outcome.result.taxCents)} />
              <Row
                label={`Tip (${outcome.percent}%)`}
                value={formatCents(outcome.result.tipCents)}
              />
            </dl>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Tip calculated on the subtotal of {formatCents(outcome.result.baseCents)}, not
              including tax.
            </p>
            <dl className="mt-2 flex items-baseline justify-between gap-4 border-t border-zinc-300 pt-3 dark:border-zinc-700">
              <dt className="text-xl font-semibold">Total</dt>
              <dd className="text-5xl font-bold tabular-nums">
                {formatCents(outcome.result.totalCents)}
              </dd>
            </dl>
          </div>
        ) : (
          <p className="text-base">{ERROR_MESSAGES[outcome.error]}</p>
        )}
      </section>
    </div>
  );
}

type AmountFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
};

function AmountField({ id, label, value, onChange, invalid }: AmountFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-base font-medium">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        className={`min-h-11 rounded-lg border bg-transparent px-3 text-2xl tabular-nums ${
          invalid ? "border-red-700 dark:border-red-400" : "border-zinc-400 dark:border-zinc-600"
        }`}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
