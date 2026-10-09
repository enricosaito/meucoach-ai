# My Coach

Personal fitness and nutrition coach. This repo currently has the foundation plus one working
flow:

- **Email + password sign-in** (Supabase Auth). A profile is created automatically for each new
  user.
- **Profile** (name, goal, units, time zone).
- **Energy test (Mifflin-St Jeor)**: BMR and TDEE, stored as an append-only history.
- **AI coach chat** that knows your profile and latest test. It uses a free mock AI by default.

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
4. On `/app`: save your profile, take the energy test, and ask the coach a question.

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
# optional, defaults to claude-opus-5-5
AI_MODEL=
```

Restart `pnpm dev`. The API refuses to start with `AI_PROVIDER=anthropic` and no key. Every call,
mock or real, is logged in the `ai_calls` table with tokens, estimated cost, latency and prompt
version. You can inspect it in Studio.

## Environment variables

See [.env.example](.env.example). Next.js reads them from `apps/web/.env.local`. The server
validates them at startup and lists anything missing or invalid. `SUPABASE_SECRET_KEY` is
server-only and must never be exposed to a client.

## CI

GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs two jobs:

- format check, lint, typecheck and unit tests
- integration tests against a fresh local Supabase, plus a check that the generated DB types are
  up to date
