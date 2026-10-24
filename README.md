# MarketQuest

An interactive stock-market learning platform and 10-round simulation for Indian beginners. Learners work through hands-on concept lessons, then manage a virtual ₹1,00,000 portfolio through fictional news events. Each round ends with a debrief that judges their reasoning separately from their profit.

> Educational simulator only. All companies, news and prices are fictional. Nothing here is investment advice.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # engine + content unit tests (Vitest)
npm run typecheck
npm run lint
npm run build
```

Browser QA scripts drive the real UI with the system Chrome via `playwright-core`. Run them against a dev server on port 3100 (`npx next dev -p 3100`):

```bash
npm run qa:simulation -- <screenshot-dir>   # plays all 10 rounds, tests validation, refresh, restart, mobile
npm run qa:lessons -- <screenshot-dir>      # completes all 11 lessons and exercises every experiment
```

## Accounts & saved progress (Google sign-in via Supabase)

Signing in is optional: every lesson and the full simulation work anonymously, with progress in `localStorage`. Signing in with Google saves progress to Supabase so it follows the user across sessions and devices.

### Setup

1. **Create a Supabase project** at [supabase.com/dashboard](https://supabase.com/dashboard).
2. **Apply the schema:** paste `supabase/migrations/20261024120000_marketquest_progress.sql` into *SQL Editor → New query → Run*, or run `supabase link` then `supabase db push`.
3. **Create Google OAuth credentials** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Configure the OAuth consent screen (app name, support email, scopes `email`, `profile`, `openid`).
   - *Create credentials → OAuth client ID → Web application*.
   - *Authorized JavaScript origins*: `http://localhost:3000` and your production URL.
   - *Authorized redirect URIs*: `https://<your-project-ref>.supabase.co/auth/v1/callback` (shown on Supabase's Google provider page).
4. **Enable Google in Supabase**: *Authentication → Sign In / Providers → Google* → paste the Client ID and Client Secret. The secret lives only in Supabase.
5. **Allow the app's callback URL**: *Authentication → URL Configuration*
   - *Site URL*: your production URL.
   - *Redirect URLs*: `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback`.
6. **Environment variables**: copy `.env.example` to `.env.local` (and add the same values in your host, e.g. Vercel → Settings → Environment Variables):

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → Data API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → Publishable key (or the legacy `anon` key as `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |

Never add the service-role/secret key or the Google client secret to this app. Without these variables the app runs exactly as before, with sign-in hidden.

### How it works

- **Flow:** "Continue with Google" → Supabase → Google → `/auth/callback` (PKCE code exchange on the server, sets session cookies) → back to the page the user came from. `src/proxy.ts` refreshes the session and protects `/account`; everything educational stays public.
- **Storage:** `profiles`, `concept_progress`, `achievements`, `simulation_sessions`, `holdings`, `sim_orders`, `round_history`. Every table has Row Level Security limiting rows to `auth.uid()`. Child rows use composite foreign keys to `(session_id, user_id)`, so they can't be attached to another user's session.
- **Writes:** one transactional `save_progress(payload)` RPC. Ownership comes from `auth.uid()`, never from the payload. Orders and rounds are insert-once (repeats are no-ops), and session state only moves forward (`progress_rank`), so stale tabs can't roll progress back.
- **Sync** (`src/lib/sync/`): pure mapping and merge logic, a cloud repository and an engine. Changes save locally at once to a per-account cache, then upload (debounced). Failures retry with backoff. An expired session prompts re-sign-in without losing local progress.
- **First sign-in migration:** lessons, quiz answers and achievements merge automatically, keeping completions and first answers. If both the device and the account hold a simulation with played rounds, the user chooses which to keep. Until they choose, the account's copy stays authoritative.
- **Sign-out** uploads anything pending, then removes the account's copy from the device.

### Testing auth without a Supabase project

```bash
npm run mock:supabase                       # local GoTrue/PostgREST stand-in: real migration on PGlite, real RLS
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local npx next dev -p 3100
npm run qa:auth -- <screenshot-dir>         # sign-in, cancel, migration, refresh, 2 devices, failure, expiry, sign-out, isolation, conflict
```

`npm test` also runs the migration on PGlite and checks RLS isolation, forged ids, idempotency and stale-write protection. The mock replaces Google's consent screen, so test real Google sign-in once your project is configured.

## Stack

Next.js 16 (App Router, Cache Components, `proxy.ts`), React 19, TypeScript, Tailwind CSS v4, shadcn-style components on Radix primitives, Lucide icons and Recharts. Optional Supabase (Auth with Google OAuth, Postgres with RLS) for accounts; otherwise progress lives in `localStorage`.

## Project structure

```
src/
  app/                    Routes: / · /learn · /learn/[slug] · /simulate · /simulate/play
                          /simulate/review/[round] · /simulate/report · /data
  content/                All authored data — no content lives in UI components
    market.ts             Fictional stocks, sectors, risk profiles, simulation config
    rounds.ts             The 10-round curriculum (news, moves + rationale, paths, alternatives, checks)
    concepts.ts           11 concept modules across 5 categories
    scoring.ts            Explicit learning-score rubric
    achievements.ts       Achievement rules
    arrange.ts            Deterministic answer-position rotation for knowledge checks
  lib/
    types.ts              Shared domain types
    engine/               Pure simulation engine (no React)
      money.ts            Integer-paise arithmetic and ₹ formatting
      orders.ts           Order validation and execution, charges, cost basis
      portfolio.ts        Valuation, P&L, allocation, concentration
      simulation.ts       Round lifecycle, scripted price moves, alternative replays
      assessment.ts       Decision-path classification and rubric scoring
      __tests__/          Unit tests
    store/                localStorage persistence (per-account scopes) and the external store
    supabase/             Browser/server Supabase clients and public config
    sync/                 Cloud mapping, merge/conflict rules, repository and sync engine
    report.ts             Concept evidence, learning path, best/worst rounds
    selectors.ts          Derived progress values
  components/
    ui/                   Design system: Button, Card, Badge, Dialog, Slider, Segmented, Stat…
    charts/               Price, portfolio-value and allocation charts
    learn/                Library, 7-step lesson view, knowledge check, 11 experiments
    simulate/             Lobby, terminal, order ticket, decision panel, debrief, report
```

## Simulation model

- **Money is integer paise.** Cash, cost basis and P&L are exact. Prices move by `round(price × (1 + pct))`.
- **Accounting identity**, checked in tests on every round: `portfolio value − ₹1,00,000 = realised + unrealised − charges`.
- **Cost basis** is tracked as a total per holding. Partial sells remove a proportional slice; full exits remove all of it.
- **Charges** are a simplified flat 0.10% of order value, shown on every order.
- **Whole shares only.** There is no short-selling and no buying beyond available cash. Orders in a batch are validated sequentially.
- **Deterministic scenarios.** A round can apply a *market-open* move (news already priced in), the user trades at that price, then scripted outcome steps play out. Every move carries the mechanism it illustrates.
- **Once only.** A round can be resolved exactly once, and a knowledge-check answer is required before advancing.
- **Alternatives** are genuine replays from the user's exact pre-trade position with the same prices.

## Learning assessment

Profit never feeds any score. There are five dimensions, each with a rubric in `content/scoring.ts`:

| Dimension | How it's scored |
|---|---|
| Concept comprehension | First-attempt correctness on lesson quizzes and debrief checks |
| Decision reasoning | 50% quality of stated reasoning, 50% authored score of the decision path |
| Risk awareness | 70% risk identified, 30% position sizing against the chosen risk profile |
| Diversification | Effective sector count (1/HHI), with a floor when within profile caps; not scored when <15% invested |
| Consistency | Share of rounds where the action matched the stated reasoning |

## Known limitations

- Orders fill instantly at the displayed price. The order-types lesson explains why real fills differ.
- Each round classifies the decision into one path (first match). Unusual mixes of trades fall into a generic "other" path.
- Anonymous progress is per browser; sign in to keep it across devices.
- The product-analytics event log stays on the device (see `/data`) and is never uploaded.
- The server trusts the client's engine results for the user's own data (RLS prevents touching anyone else's). Re-running the engine server-side would make scores tamper-proof.

## Possible next steps

- Accounts and server-side persistence (the store already isolates persistence in `lib/store/persistence.ts`).
- More scenario packs: rounds are plain data, so new curricula need no engine changes.
- Limit and stop-loss orders inside the simulation, reusing the lesson's order-book logic.
