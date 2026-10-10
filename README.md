# My Coach

Personal training coach for the Brazilian market (Portuguese and English). What works today:

- **Email + password sign-in** (Supabase Auth). A profile is created automatically for each new
  user.
- **Profile** (name, goal, units, language, time zone) and an **energy test** (Mifflin-St Jeor)
  with **daily calorie and macro targets**.
- **AI workout plans**: a short questionnaire plus optional progress photos (front/side/back).
  Photos are analysed by AI (body-fat range, body type, priority areas) with explicit consent,
  and the plan is generated in a background job (Inngest).
- **AI coach chat** that knows your profile, targets and plan. The app runs on a free mock AI by
  default.

Architecture and contribution rules live in [CLAUDE.md](CLAUDE.md).

## Prerequisites

- **Node.js 22+** (LTS)
- **pnpm 12**: `npm i -g pnpm@12.10.1` (or `corepack enable`)
- **Docker Desktop**, running (local Supabase runs in containers)
- **Supabase CLI** 2.111+: `npm i -g supabase`, or see the
  [install guide](https://supabase.com/docs/guides/local-development/cli/getting-started)

## First-time setup

```bash
pnpm install
pnpm bootstrap      # starts local Supabase, applies migrations, writes apps/web/.env.local
pnpm dev            # http://localhost:3000
```

`pnpm bootstrap` is `pnpm db:start` followed by `pnpm env:setup`. The first `db:start` downloads
the Supabase images, which takes a few minutes.

### Try the flow

1. Create a user: in Supabase Studio (http://127.0.0.1:54323) go to Authentication → Users →
   **Add user**, enter an email and password, and tick **Auto confirm user**. There is no
   sign-up page yet.
2. Open http://localhost:3000. You'll be redirected to `/login`.
3. Sign in with that email and password.
4. On `/app`: set your goal, take the energy test, then go to **Training** and create a plan
   (add photos or skip them). Watch the job run in the Inngest Dev Server at
   http://localhost:8288. Then ask the coach a question.

Other local URLs: Supabase Studio at http://127.0.0.1:54323 and the API at
http://localhost:3000/api/v1/health.

## Daily commands

| Command                          | Description                                             |
| -------------------------------- | ------------------------------------------------------- |
| `pnpm dev`                       | Run the web app and API                                 |
| `pnpm db:start` / `pnpm db:stop` | Start / stop local Supabase                             |
| `pnpm db:reset`                  | Wipe the local DB and re-apply migrations + seed        |
| `pnpm db:types`                  | Regenerate DB types after changing a migration          |
| `pnpm env:setup`                 | Recreate `apps/web/.env.local` (`--force` to overwrite) |
| `pnpm lint`                      | Lint (includes module-boundary rules)                   |
| `pnpm typecheck`                 | Type-check all packages                                 |
| `pnpm test`                      | Unit tests                                              |
| `pnpm test:integration`          | API + security (RLS) tests against local Supabase       |
| `pnpm format`                    | Format with Prettier                                    |

### Changing the database

1. Add a migration: `supabase migration new <name>`, then write SQL in `supabase/migrations/`.
2. `pnpm db:reset` to apply it locally.
3. `pnpm db:types` and commit the regenerated `packages/db/src/database.types.ts`.

## Switching the AI provider (mock → Claude)

Local dev uses `AI_PROVIDER=mock`: deterministic answers, no API costs, and an artificial delay of
`AI_MOCK_DELAY_MS`. To use real Claude responses, edit `apps/web/.env.local`:

```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
# optional overrides: fast = chat (default claude-sonnet-5-5),
# smart = workout plans + photo analysis (default claude-opus-5-5)
AI_MODEL_FAST=
AI_MODEL_SMART=
```

Restart `pnpm dev`. The API refuses to start with `AI_PROVIDER=anthropic` and no key. Every call,
mock or real, is logged in the `ai_calls` table with tokens, estimated cost, latency and prompt
version. You can inspect it in Studio.

## Background jobs (Inngest)

Plan generation runs as an Inngest function. Locally, `pnpm dev` starts the Inngest Dev Server
(`INNGEST_DEV=1`, dashboard at http://localhost:8288) next to Next.js. In production, install
the Inngest integration from the Vercel Marketplace (it sets `INNGEST_EVENT_KEY` and
`INNGEST_SIGNING_KEY`) and do **not** set `INNGEST_DEV`. Without it, plan requests are saved but
stay pending.

## Environment variables

See [.env.example](.env.example). Next.js reads them from `apps/web/.env.local`. The server
validates them at startup and lists anything missing or invalid. `SUPABASE_SECRET_KEY` is
server-only and must never be exposed to a client.

## CI

GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs two jobs:

- format check, lint, typecheck and unit tests
- integration tests against a fresh local Supabase, plus a check that the generated DB types are
  up to date
