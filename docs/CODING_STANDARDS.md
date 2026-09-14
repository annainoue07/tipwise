# Coding Standards

Conventions here exist mainly to make many contributors — human and AI —
produce code that looks like it came from one author. Consistency matters more
than the specific choices below.

## TypeScript

- `strict: true`. No exceptions, no `// @ts-expect-error` without a comment
  explaining why and a linked issue.
- **Never `any`.** Use `unknown` at trust boundaries and narrow with Zod.
- Prefer `type` over `interface` except when declaring a contract meant to be
  implemented by multiple classes (e.g. `ReceiptExtractor`).
- No default exports outside Next.js pages and layouts, which require them.
  Named exports survive renames and are greppable.
- Functions that can fail return a result, not an exception, when the failure
  is expected (a receipt that cannot be parsed is expected). Reserve `throw`
  for programmer error.

## Money

All monetary values are **integer cents**. Every one of them.

```ts
// Correct
const tip = calculateTip({ subtotalCents: 4250, percent: 18 });

// Wrong — will produce 7.699999999999999 somewhere and ship it
const tip = subtotal * 0.18;
```

Variables holding money end in `Cents`. This is enforced by review and by
convention rather than by the type system, so it needs to be visible in the
name. Formatting to a display string happens once, at the UI boundary.

Rounding is explicit and documented at each site. Half-up on the final cent
unless a specific test says otherwise.

## Testing

Vitest. The rules:

- **`packages/core` requires tests for every exported function.** This is where
  correctness lives; coverage here is non-negotiable.
- Test behaviour, not implementation. A test that breaks when you rename a
  private helper is a liability.
- Include the boring edge cases explicitly: zero subtotal, gratuity already
  included, tax larger than expected, absurdly large bills, negative inputs.
- **Never write a test that asserts what the code currently does in order to
  make CI pass.** If a test is failing and you do not understand why, say so.
  Changing the assertion to match broken behaviour is the single most damaging
  thing an agent can do to this repo, because it converts a caught bug into a
  permanently enshrined one.
- Tests must be deterministic. No real network, no real clock. Inject both.

## Structure and duplication

Before writing a new utility, search for an existing one. Duplicated,
slightly-different implementations of the same logic are the characteristic
failure of multi-agent codebases, and they are hard to detect later because
each copy looks reasonable on its own.

```bash
rg "function.*[Tt]ip" packages/core/src
```

If you find something close but not identical, extend it rather than forking
it — or explain in the PR why a separate function is genuinely warranted.

File naming: `kebab-case.ts`. Component files match their exported component
name. One primary export per file.

## Comments

Comment **why**, not **what**. The code says what it does.

```ts
// Bad: increments the counter
// Good: providers occasionally return the tax line as the subtotal, so we
//       cross-check against the total before trusting either field
```

Do not add comments restating a function signature. Do not add file-header
banners. Do not leave commented-out code — that is what git is for.

## Error handling

- User-facing errors are plain and actionable: "Couldn't read that receipt —
  enter the amount below." Not "Error: extraction failed (code 4)."
- Never swallow an error silently. If recovery is genuinely correct, log why.
- Server logs must never contain image data, request bodies, or the API key.
  Log the failure class and timing, nothing more. There is no user data in
  this system and logging must not accidentally create some.

## Accessibility

The app is used one-handed, in dim restaurants, sometimes by people in a hurry.

- Tap targets at least 44×44 px.
- Text contrast meets WCAG AA.
- Every interactive element is reachable and labelled for screen readers.
- Numbers are legible at arm's length — the total is the largest thing on screen.

## Tipping content

Norms live in `packages/core/src/data/services.ts` and nowhere else. Each entry
carries its expectation level, typical range, and a short neutral explanation.

The product's stance is **informative, not persuasive**. Guidance describes
what is customary; it does not pressure the user toward tipping more. When
tipping is genuinely optional, say so plainly. This is the reason the app
exists — copy that nudges users toward higher tips defeats its purpose.

**Agents must not add or edit tipping norms.** Content changes are a human
decision requiring a source. An agent that needs a missing service type should
open an issue labelled `content`, not invent an entry.
