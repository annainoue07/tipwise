# TipWise — Agent Instructions

Consumer tipping assistant. Four features: tip calculator, receipt scanner,
"Should I Tip?" guidance, and a tip advisor questionnaire.
Web first (Next.js), native mobile later (Expo).

**This file is loaded into every session, so it stays short.** Detail lives in
`docs/`, which you read on demand.

## Read before your first edit

- `docs/ARCHITECTURE.md` — system shape, data flow, what lives where
- `docs/CODING_STANDARDS.md` — conventions, naming, testing rules
- `docs/adr/` — decisions already made. Do not relitigate these.

## Non-negotiable constraints

These are product and security boundaries, not style preferences. If a task
appears to require breaking one, **stop and ask** rather than working around it.

1. **No persistent user data.** No database, no accounts, no auth, no sessions,
   no analytics tied to individuals. Receipt images are held in memory for the
   duration of one request and never written to disk or object storage.
2. **Tipping guidance is data, not model output.** Every norm, range, and
   recommendation comes from `packages/core/src/data/`. Never call an LLM to
   decide whether a tip is expected or to compute an amount. Identical inputs
   must always produce identical outputs.
3. **Exactly one LLM call exists in this codebase**: receipt extraction, in
   `apps/web/src/app/api/scan/`. Its response must be parsed through the Zod
   schema in `packages/core/src/receipt/schema.ts` before any other code sees
   it. Unvalidated model output is a bug.
4. **Money is integer cents.** Never floats, never `parseFloat` on user input.
   Use the helpers in `packages/core/src/money.ts`. A test that asserts
   `0.1 + 0.2 === 0.3` failing is the reason.
5. **Tip is calculated on subtotal, not on total.** This is the product's
   entire point. The UI must always show which base was used.
6. **No new runtime dependency without an ADR.** `packages/core` stays at zero
   dependencies.

## Workflow

1. Work only from a GitHub issue labeled `ready`. No issue, no PR.
2. Branch: `feat/<issue-number>-short-slug`, `fix/...`, `docs/...`, `chore/...`
3. Before opening a PR, run `pnpm verify` (typecheck + lint + test). It must
   pass locally. CI runs the same command — do not open a PR expecting CI to
   tell you something you could have learned in 30 seconds.
4. One issue per PR. If you discover unrelated work, open a new issue and
   label it `needs-triage`. Do not fix it in the current PR.
5. Fill in the PR template honestly, including the "what I did not test"
   section. An accurate limitation is worth more than a confident claim.

## When you are uncertain

Say so and stop. A question costs one message. A wrong assumption implemented
across fifteen files costs an afternoon of unwinding.

Specifically, stop and ask when: the task implies storing user data; a tipping
norm is not in the data files and you would have to invent it; a dependency
seems necessary; or two documents in this repo contradict each other.

**Never invent tipping norms.** If a service type is missing from
`packages/core/src/data/services.ts`, that is a content task for a human, not a
gap for you to fill from general knowledge. Wrong guidance in this app is worse
than absent guidance.
