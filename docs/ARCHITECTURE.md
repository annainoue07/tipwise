# Architecture

## What this app is

A consumer tipping assistant. The user is standing at a counter or holding a
bill and has seconds to decide. Everything below serves that: fast, offline
where possible, and honest about what it does and does not know.

## Shape of the system

```
┌─────────────────────────────────────────────────────────┐
│  packages/core          pure TypeScript, zero deps      │
│                                                          │
│  money.ts               integer-cent arithmetic          │
│  tip.ts                 tip calculation from subtotal    │
│  advisor.ts             questionnaire → recommendation   │
│  data/services.ts       US tipping norms (static data)   │
│  receipt/schema.ts      Zod schema for extracted fields  │
└─────────────────────────────────────────────────────────┘
              ▲                              ▲
              │ imports                      │ imports
   ┌──────────┴───────────┐      ┌───────────┴──────────┐
   │  apps/web            │      │  apps/mobile         │
   │  Next.js App Router  │      │  Expo (later)        │
   │                      │      │                      │
   │  /                   │      │  Same core logic,    │
   │  /scan               │      │  native camera       │
   │  /guide/[service]    │      │                      │
   │  /advisor            │      │                      │
   │  /api/scan  ◄────────┼──────┼──── POST image       │
   └──────────┬───────────┘      └──────────────────────┘
              │
              ▼
    Vision model API (provider-swappable)
```

## Why the logic lives in `packages/core`

Three reasons, in order of importance:

1. **Correctness is testable in isolation.** Tip math and tipping norms have no
   UI, no network, and no I/O. They can be tested exhaustively in milliseconds.
   This is where nearly all the test value in this project lives.
2. **Two clients, one truth.** When the mobile app arrives, it imports the same
   functions. A tipping rule can never differ between web and native because
   there is only one copy.
3. **It is the part worth protecting.** UI can be rewritten in a weekend. The
   accumulated correctness of the rules is the actual product.

`packages/core` has **zero runtime dependencies** and never imports React,
Next.js, or anything platform-specific. If you find yourself needing `window`
or `fs` in core, the logic belongs in an app instead.

## Data flow: the three offline features

Calculator, guide, and advisor are entirely client-side. No network call, no
server, works on airplane mode in a basement restaurant. The tipping norms ship
in the JS bundle because the dataset is small (a few dozen US service types)
and staleness is measured in years.

## Data flow: receipt scanning

The only server-touching feature.

1. Client downscales the image (longest edge ~1500px) and compresses to JPEG.
   **This happens before upload** — it cuts bandwidth, latency, and per-call
   vision cost substantially, and receipts remain legible at that size.
2. `POST /api/scan` with the image bytes. No auth; see rate limiting below.
3. The route calls the vision model behind the `ReceiptExtractor` interface,
   asking for subtotal, tax, total, and merchant as structured JSON.
4. The response is parsed with the Zod schema. **Malformed output is a failure,
   not something to coerce.** Return an error and let the user type the amount.
5. Sanity checks run on the parsed numbers: subtotal + tax should approximate
   total, values must be non-negative and within plausible bounds. Failing
   these downgrades confidence rather than silently accepting nonsense.
6. The image is discarded when the request ends. Nothing is written anywhere.
7. The client shows extracted values **as editable fields, pre-filled** — never
   as a finished answer. The user confirms or corrects before calculating.

Step 7 matters more than it looks. OCR on a crumpled receipt under bad lighting
will sometimes be wrong, and a tipping app that confidently reports the wrong
total is worse than one that asks. Design for correction, not for magic.

### Provider abstraction

The vision call sits behind an interface so the provider can be swapped when
pricing or quality changes:

```ts
interface ReceiptExtractor {
  extract(image: Buffer, mimeType: string): Promise<unknown>;
}
```

The route depends on the interface, not the vendor SDK. The Zod schema is the
contract; any provider that satisfies it is acceptable. This also makes the
route testable with a fake extractor and no network.

## Cost and abuse control

An unauthenticated endpoint that spends money per request is the primary risk
in this system. Defence is layered, and every layer is required:

| Layer | Mechanism |
| --- | --- |
| Request size | Reject payloads over ~2 MB before reading the body |
| Content type | Accept only `image/jpeg` and `image/png` |
| Per-IP rate limit | Small burst, low daily ceiling |
| Global daily cap | Hard stop on total scans per day, fail closed |
| Provider budget alert | Configured at the vendor, independent of app code |
| Client-side downscale | Reduces per-call cost on every legitimate request |

Fail closed. When the daily cap is hit, the scan endpoint returns a clear error
and the UI falls back to manual entry — which is a fully functional path, not a
degraded one. The app remains useful with the scanner entirely disabled.

## Deployment

- **Web:** Vercel. Static pages served from CDN, one serverless function for
  `/api/scan`. The free tier covers early usage; the paid tier is inexpensive.
- **Secrets:** the vision API key lives in Vercel environment variables and
  exists only server-side. It is never referenced in client code, never
  prefixed `NEXT_PUBLIC_`, and never committed. This is the single most
  important secret in the project because it maps directly to money.
- **Environments:** production plus Vercel's automatic per-PR preview
  deployments. No separate staging environment — with no database to migrate
  and no user data to corrupt, staging would add ceremony without reducing
  risk. Revisit if that stops being true.
- **Mobile:** Expo with EAS Build, submitted to the App Store. Requires an
  Apple Developer account. Deferred until web is validated.

## What deliberately does not exist

Recorded here so nobody adds them by reflex, and so agents do not "helpfully"
scaffold them:

- No database. No ORM. No migrations.
- No authentication, user accounts, or sessions.
- No image or file storage.
- No background jobs or queues.
- No Docker for the app itself. Vercel builds from source; a Dockerfile would
  be a second build path to keep in sync with no benefit.
- No Kubernetes, Terraform, or infrastructure-as-code. One serverless function
  and a static site do not need an orchestration layer.

Each absence has a trigger that would justify adding it — see
`docs/adr/0002-stateless-architecture.md`.
