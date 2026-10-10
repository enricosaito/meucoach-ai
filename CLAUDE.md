# My Coach: rules for working in this repo

Personalized, training-first fitness app (with nutrition targets) for the Brazilian market, in
Brazilian Portuguese (default) and English. **Modular monolith** in a pnpm + Turborepo monorepo, TypeScript
strict everywhere. Built to scale to 100k+ users. **Mobile-first since 2026-10-10:** the product
UI is the Expo app (`apps/mobile`); the Next.js web UI is paused (no new features) and keeps the
API, background jobs, landing and legal pages. Everything below `apps/` stays client-agnostic.

**Mobile (`apps/mobile`)**: Expo SDK 57, Expo Router (routes in `src/app`, native tabs), plain
React Native styles with tokens in `src/theme.ts` (same colors as web), shared `@mycoach/*`
packages for contracts, API client and i18n. Reads go to Supabase under RLS, writes to the API
with a Bearer token. Native builds use production by default (`src/lib/env.ts`); the web preview
in dev uses the local stack. Read `apps/mobile/AGENTS.md` before touching Expo APIs (versioned
docs, `npx expo install` for native packages, no hand-edited `ios/`/`android/`).

**Start here:** [docs/status.md](docs/status.md) has the current state, deploy procedure, known gotchas,
open items and the next checkpoint. Keep it updated at the end of each checkpoint.

## Layout

```
apps/web/                 Next.js 16 (App Router, Tailwind 4). UI only + mounts the API.
  src/app/api/[[...route]]/route.ts   forwards /api/* to the Hono app (no logic here)
  src/server/             the ONLY web code allowed to construct the API / admin client
  src/lib/                api client, Supabase browser/server clients, hooks
  src/proxy.ts            refreshes the Supabase session cookie, guards pages
  src/app/app/            signed-in screens: Home, training/, diet/, coach/, energy/, profile/
                          (read-only overview) + profile/settings (EVERYTHING the user edits:
                          photo, name, @username, goal, language, units, privacy). Layout = auth + MeProvider
                          (GET /me, time-zone sync, daily check-in) + AppShell (header, tab bar)
  src/components/ui.tsx   design-system primitives; colors are semantic tokens from
                          globals.css (bg-surface, text-muted, bg-accent…), dark mode automatic
packages/api/             Hono app: /api/v1 routes + middleware. Framework-agnostic.
packages/api-client/      typed hono/client wrapper for web and future mobile
packages/i18n/            translations (en = source, pt-BR) + framework-agnostic translator
packages/jobs/            Inngest client, typed events, outbox dispatcher, background functions
packages/core/src/
  shared/                 AppError, Logger interface, db helpers (no domain logic)
  modules/<module>/
    index.ts              server-side public API (services, factories)
    contracts.ts          client-safe public API (Zod schemas, constants, DTO types, pure fns)
    domain/               pure business rules + *.test.ts (no I/O)
    data/                 repositories (Supabase queries), only place that touches tables
    schemas.ts, types.ts, service.ts, prompts/ (versioned AI prompts), ai/ (coaching only)
packages/db/              Supabase client factories + generated types (database.types.ts)
packages/config/          shared tsconfig, ESLint (incl. module boundaries), Prettier
supabase/migrations/      SQL migrations, the only source of schema truth
docs/                     decisions and checklists (e.g. mobile-permissions.md)
```

Modules today: `profile` (profile, locale, consents, Mifflin-St Jeor energy test), `nutrition`
(daily calorie and macro targets, pure and derived, never stored; diet questionnaire and AI diet
plans generated in a background job, validated against the targets), `coaching` (AI gateway with
`fast`/`smart` model tiers, coach chat), `training` (questionnaire, body-photo scans with AI
analysis, AI workout plans generated in a background job, workout log) and `gamification`
(append-only `activity_days` and `xp_events`, login streaks, levels). Planned: `billing`
(freemium entitlements).

## Non-negotiable rules

1. **Module boundaries.** Code outside a module imports it only via `@mycoach/core/<module>` (=
   `index.ts`) or `@mycoach/core/<module>/contracts`. Inside core, modules import each other only
   through `index.ts`/`contracts.ts`, and `shared` never imports a module. Enforced by
   `eslint-plugin-boundaries` (`packages/config/eslint/boundaries.js`). A module never queries
   another module's tables; it calls that module's public API (e.g. coaching uses
   `profile.getCoachingContext`).
2. **UI imports only `contracts`.** `apps/web` (outside `src/server`) may import only
   `@mycoach/core/*/contracts` and never `@mycoach/db/admin` or `@mycoach/api` (lint-enforced).
   Contracts must stay free of data access and SDKs.
3. **All writes go through the API.** Clients may only READ directly from Supabase, and only their
   own rows (RLS). There are no INSERT/UPDATE/DELETE policies or grants for `anon`/`authenticated`.
   Never add one.
4. **User ID only from the verified token.** The API derives it in `requireAuth` (`c.var.userId`)
   from a verified JWT (Bearer header or session cookie). Never read a user ID from the body,
   query or params. Zod schemas are `strictObject`, so unknown keys like `userId` are rejected.
5. **Service role is server-only.** `SUPABASE_SECRET_KEY` bypasses RLS, so every repository query
   MUST be scoped by `userId` (`.eq('user_id', userId)` / `.eq('id', userId)`). Never expose the key
   or a `NEXT_PUBLIC_` variant of it.
6. **Schema changes only via migrations.** Add `supabase/migrations/<timestamp>_<name>.sql`
   (never edit an applied migration, never use the dashboard), then `pnpm db:reset` and
   `pnpm db:types`, and commit the regenerated types. Every new table needs: RLS enabled,
   read-own SELECT policy (if user-facing), and **explicit grants**: new tables have no Data API
   privileges by default. `authenticated` gets SELECT only; `service_role` gets what the API needs.
   Index `(user_id, created_at desc)` for per-user lists.
7. **AI calls only through the gateway** (`createAiGateway` in `coaching`). Never import an AI SDK
   anywhere else. Every call is recorded in `ai_calls` (model, prompt version, tokens, cost,
   latency, status, request ID). Local dev and tests use the `mock` provider.
8. **Prompts are versioned files** (`<module>/prompts/<name>.v<N>.ts` exporting `version`), owned
   by the module that owns the feature (coach chat in `coaching`, plans and photo analysis in
   `training`). AI calls pick a tier (`fast` chat, `smart` plans/vision), never a model.
   Never edit a shipped version; add `v2` and switch `prompts/index.ts`. Store the version with
   results.
9. **Pure domain logic is separate from data access.** Business rules live in `domain/` as pure,
   unit-tested functions. Services orchestrate; repositories only query.
10. **Mutations are idempotent.** Every POST/PUT/PATCH/DELETE requires an `Idempotency-Key` header
    (middleware replays the stored response for retries). Clients reuse the key when retrying the
    same write (`useWrite` in web). Persist multi-row writes atomically (single statement or a
    Postgres function) so retries never leave partial state.
11. **Slow/expensive work belongs in background jobs** (Inngest, `packages/jobs`), never in the
    HTTP request. The coach chat reply is the deliberate exception (interactive). Write an
    `outbox_events` row in the SAME transaction as the data change (a Postgres function, e.g.
    `training_request_plan`); the dispatcher (cron + a nudge from the API) forwards it to Inngest
    with the outbox id as event id. Every step must be idempotent and safe to retry (check
    status before calling the AI; never call the AI twice for the same row).
12. **Derived data is recomputable.** Use append-only logs as the source of truth (e.g.
    `metabolic_assessments`, future `xp_events`); totals/levels/streaks are derived.
13. **Validate everything with Zod** from `packages/core` (`jsonBody(schema)` in routes). Errors
    use one shape: `{ error: { code, message, requestId, details? } }` via `AppError`.
14. **Logging:** structured JSON (pino), always with `requestId`; use `c.var.logger` in the API.
    No `console.*` in packages (lint error).
15. **Every user-facing string is translated.** Add keys to `packages/i18n/src/messages/en.ts`
    and `pt-BR.ts` (the type checker and tests fail if keys or `{placeholders}` differ). UI uses
    `useI18n()` (client) / `getTranslator()` (server); format numbers and dates with its
    `formatNumber` / `formatDate`, never hard-code separators. API error `message`s stay English
    for logs; clients translate by `error.code`. The user's language is `profiles.locale`
    (default `pt-BR`); AI prompts must make the model reply in it.
16. **Sensitive data needs explicit, versioned consent (LGPD).** Body photos and health data are
    sensitive. Photo uploads require an active `consents` row (`CONSENT_VERSIONS`); revoking it
    must delete the data (`ON_REVOKE` in `routes/me.ts`). Photos live in the private `body-photos`
    bucket under `{userId}/...`, are uploaded only via signed URLs from the API, resized and
    EXIF-stripped on the client, and shown only via short-lived signed URLs. Any new sensitive data
    must be reflected in the Privacy Policy (`apps/web/src/content/legal.ts`).

## API conventions (`packages/api`)

- Middleware order: request ID → error handler → auth → per-user rate limit → idempotency.
- Add routes as chained Hono routers (`new Hono<AppEnv>().get(...).post(...)`) so `hono/client`
  infers types. Routes are thin: validate, call a module service, return JSON.
- Dependencies come from `c.var.deps` (`AppDeps`); swap implementations in `createDefaultDeps`
  (e.g. Upstash rate limiter) without touching routes.
- Standalone later: `serve({ fetch: createApp(deps).fetch })` with `@hono/node-server`.

## Commands

| Command                 | What it does                                                         |
| ----------------------- | -------------------------------------------------------------------- |
| `pnpm bootstrap`        | `db:start` + `env:setup` (first run)                                 |
| `pnpm dev`              | Next.js (web + API) on :3000 + Inngest Dev Server on :8288           |
| `pnpm mobile`           | Expo dev server (:8081): QR for Expo Go on a phone, `w` for web      |
| `pnpm db:start`         | Start local Supabase (Docker). Studio :54323, Mailpit inbox :54324   |
| `pnpm db:stop`          | Stop local Supabase                                                  |
| `pnpm db:reset`         | Re-apply migrations + seed (demo user), restart storage (local)      |
| `pnpm db:types`         | Regenerate `packages/db/src/database.types.ts`                       |
| `pnpm db:push:check`    | PRODUCTION: list pending migrations (dry run)                        |
| `pnpm db:push`          | PRODUCTION: apply pending migrations                                 |
| `pnpm db:migrations`    | PRODUCTION: local vs remote migration history                        |
| `pnpm env:setup`        | Write `apps/web/.env.local` from `.env.example` + `supabase status`  |
| `pnpm lint`             | ESLint everywhere (incl. module boundaries)                          |
| `pnpm typecheck`        | `tsc --noEmit` everywhere                                            |
| `pnpm test`             | Unit tests (Vitest)                                                  |
| `pnpm test:integration` | API + RLS tests against local Supabase (needs `db:start`)            |
| `pnpm format`           | Prettier write (`format:check` in CI)                                |
| `pnpm verify`           | format, lint, typecheck, unit + integration tests (~1 min)           |
| `pnpm ship`             | PRODUCTION: verify → `db:push` → `git push origin main` (deploys)    |
| `pnpm health`           | PRODUCTION job pipeline health (`--local` for :3000); exit 1 = stuck |
| `pnpm inngest:status`   | PRODUCTION Inngest events/runs (key in root `.env.local`)            |

Before finishing a change run `pnpm verify` (needs `pnpm db:start`). Release with `pnpm ship`, then
`pnpm health` once Vercel has deployed. Local demo user (seeded): `demo@example.test` /
`demo-password-123`. A scheduled GitHub Action (`.github/workflows/monitor.yml`) checks
`/api/v1/health/jobs` every 15 min and fails (emailing the owner) when jobs are stuck.

## Gotchas

- The Supabase MCP server (`.mcp.json`) has write access to the PRODUCTION project. Use it to read,
  debug, run advisors and manage test data. Never use it for schema changes (`apply_migration`,
  DDL via `execute_sql`): add a migration file and `pnpm db:push` so the repo stays the source
  of truth. Delete any test users/data you create.
- `pnpm db:push*` use the owner's access token from the git-ignored root `.env.local`
  (`scripts/with-supabase-token.mjs`), never the machine's `supabase login`. Claude may run them:
  always `db:push:check` first, push only migrations that passed `pnpm test:integration`
  locally, and push BEFORE pushing code that needs them to `main` (auto-deploys). Never print the
  token or read the file.
- Workspace packages ship TS source (no build step); Next transpiles them (`transpilePackages`).
- pnpm 12 blocks dependency install scripts unless listed in `allowBuilds` (`pnpm-workspace.yaml`).
- `AGENTS.md` is managed by Turborepo; leave it in place.
