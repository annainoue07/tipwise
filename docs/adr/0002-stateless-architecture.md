# 2. Stateless architecture — no database, no accounts, no stored images

Date: 2026-09-07
Status: Accepted

## Context

TipWise helps a user decide whether and how much to tip, then calculates a
total. The four features are a calculator, a static tipping-norms guide, a
questionnaire-based advisor, and a receipt scanner.

An early draft of the design assumed user accounts, a Postgres database, and
object storage for receipt images — the default shape for "an app where users
upload photos." Examining what the product actually does showed none of it was
required.

The user scans a receipt to get a number, applies a percentage, sees a total,
and pays. The interaction is over in seconds and has no value afterwards.
Calculation history was explicitly ruled out of scope.

## Decision

The system stores nothing. Specifically:

- No database of any kind.
- No user accounts, authentication, or sessions.
- Receipt images exist only in memory during a single request and are never
  written to disk or object storage.
- Tipping norms ship as static data compiled into the client bundle.

The only server-side component is one serverless function that proxies an image
to a vision model and returns extracted numbers.

## Consequences

**Good:**

- No user data at rest means no breach surface, no GDPR/CCPA data-subject
  machinery, no retention policy, no encryption-at-rest decisions, and nothing
  to leak. For an app handling financial documents this is a substantial
  security and legal advantage, not merely a simplification.
- Three of four features work fully offline, which matters when the app is used
  in restaurants with poor signal.
- Running cost approaches zero. Static hosting is free; the only variable cost
  is per-scan vision calls.
- Far less code, so far less surface for bugs and far less for agents to
  misunderstand.

**Bad / accepted trade-offs:**

- No cross-device history, no export, no spending analytics. These are real
  product features being forgone.
- Monetization paths requiring identity (subscriptions, usage tiers) are
  unavailable without revisiting this decision.
- The scan endpoint is unauthenticated, so abuse must be prevented by rate
  limiting and spend caps rather than by identity. See `docs/ARCHITECTURE.md`.

## Revisit this decision when

Any one of these makes the trade-off worth re-examining:

1. Users ask for calculation history across devices with real frequency.
2. Expense-report export becomes a priority (implies persistence and probably
   accounts).
3. A paid tier requiring entitlement checks is introduced.
4. Rate-limit abuse cannot be controlled without identity.

Until then, treat statelessness as a firm constraint. Adding a database
"because we might need it" would forfeit every advantage above for a benefit
nobody has asked for.

## Notes for agents

If a task appears to require persistence, that is a signal the task conflicts
with this decision — **stop and ask** rather than introducing storage. A new
ADR superseding this one is the correct way to change the answer.
