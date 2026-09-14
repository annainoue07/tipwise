## What and why

Closes #

<!-- One paragraph. What changed, and what problem it solves. -->

## How to verify

<!-- Exact steps a reviewer follows to see this working. Not "run the tests" —
     what did you click, what did you see? -->

## What I did NOT test

<!-- Required. Be specific and honest. "Did not test with a blurry receipt" or
     "did not verify on Safari" is useful. "Nothing" is almost never true and
     reads as a lack of attention rather than thoroughness. -->

## Checklist

- [ ] `pnpm verify` passes locally (typecheck, lint, tests)
- [ ] New exported functions in `packages/core` have tests
- [ ] No test assertion was changed to match existing behaviour
- [ ] No new runtime dependency (or: an ADR is included)
- [ ] No user data is stored, and no image is written to disk
- [ ] Money handled as integer cents throughout
- [ ] Tipping norms unchanged (content edits are a separate, human-authored PR)
- [ ] Scope matches the linked issue — no unrelated changes ride along

## Anything you were unsure about

<!-- Assumptions made, alternatives considered, places where you guessed.
     Flagging uncertainty here is a positive signal, not an admission. This is
     the section reviewers read most carefully. -->
