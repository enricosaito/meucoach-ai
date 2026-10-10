# Project status and handoff

Read this first in a new session (rules live in [CLAUDE.md](../CLAUDE.md)). Update it at the end of
every checkpoint. Last updated: 2026-10-10.

## Product decisions (from the founder)

- **Training-first** fitness app for **Brazil**: Brazilian Portuguese is the default, English also
  supported from day one. Mobile-first; an Expo app (`apps/mobile`) comes later and must reuse
  `packages/*` (contracts, api-client, i18n).
- **Freemium**: unlimited AI use is a paid feature (billing not built yet).
- **AI workout plans** built from a short questionnaire plus optional progress photos (front / side /
  back, any 1–3), "like SHAPED": body-fat range, body type, priority areas, posture notes. Photos
  are kept for progress comparison. A deeper onboarding questionnaire comes later.
- **Daily macro targets** (calories, protein, carbs, fat) are essential.
- **Gamification** wanted: streaks (login streak done), XP, levels.
- Models: **Opus 5.5 for plans and photo analysis (`smart` tier), Sonnet 5.5 for chat (`fast`)**.
  Production still runs `AI_PROVIDER=mock` until the founder adds an Anthropic key.
- Founder prioritises speed; Claude has write access to production Supabase via MCP (see the
  guardrail in CLAUDE.md: schema changes still only via migrations).

## What is built

| Area         | Status                                                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundation   | Monorepo, Hono API in Next.js, RLS + explicit grants, idempotency, rate limit, CI workflow                                                                |
| Auth         | Email + password (no sign-up / reset UI yet; users created in the Supabase dashboard)                                                                     |
| i18n         | `packages/i18n` (pt-BR default, en), plural support, locale saved on profile                                                                              |
| Profile      | Display name, unique @username, avatar (public bucket), goal; settings page (language, units, time zone, privacy, sign out)                               |
| Energy       | Mifflin-St Jeor test, history, derived daily targets (`nutrition` module)                                                                                 |
| Coach chat   | Prompt `coach-chat@2` (language, goal guidance, targets, local time), mock in prod                                                                        |
| Training     | Questionnaire, consent-gated body photos (private bucket), AI analysis + plan in an Inngest job via the outbox, plan UI, progress photos, delete / revoke |
| Gamification | Append-only `activity_days`, daily check-in, login streak on Home                                                                                         |
| Legal        | Privacy Policy + Terms (pt-BR / en), **drafts** with [placeholders]                                                                                       |

Tests: ~130 unit (pure domain, prompts, i18n), 45 integration (API + RLS + storage + jobs) against
local Supabase.

## Environments and deploy

- **Local**: `pnpm dev` (Next :3000 + Inngest Dev Server :8288), Supabase via Docker
  (`pnpm db:start`). Local test user `demo@example.test` / `demo-password-123`.
- **Production**: https://meucoach-ai.vercel.app (Vercel project `meucoach-ai`, team
  `team_P15hwtXayUvgS69AzCU6WZOl`, functions in `gru1`), Supabase `gucypanajihwfocfpjzk`
  (`sa-east-1`), Inngest connected via the Vercel Marketplace (keys in Vercel env). Deployment
  protection is currently off.
- **Deploy procedure** (CLI, not git push):
  1. `supabase db push --dry-run`, then `supabase db push --yes` if migrations are pending.
  2. `vercel deploy --prod --yes`.
  3. `curl -X PUT https://meucoach-ai.vercel.app/api/inngest` → `"Successfully registered"`.
  4. Check `vercel logs --environment production --no-branch --since 10m` for errors.
- **Git**: `main` is pushed to `enricosaito/meucoach-ai` and CI is green. Every push to `main` also
  triggers a Vercel production deploy (repo connected), so run `supabase db push` BEFORE pushing
  code that needs a new migration.

## Gotchas seen in this project

- **Docker Desktop won't start** (unreadable socket files on this Windows Insider build): stop
  Docker, rename `%LOCALAPPDATA%\Docker\run` and `%LOCALAPPDATA%\docker-secrets-engine` to
  `*.stale-<timestamp>`, recreate an empty `Docker\run`, `docker desktop start`.
- **Supabase CLI login keeps getting replaced** by another account on this machine. Prefer the
  Supabase MCP server for reads/writes; for `db push`, re-run `supabase login` or set
  `SUPABASE_ACCESS_TOKEN` for this repo.
- Vercel CLI was once switched to another account (`ripaames-2699`); check `vercel whoami`.
- Git Bash mangles paths: `export MSYS_NO_PATHCONV=1` before `vercel curl /api/...`.
- `vercel env add ... preview` fails non-interactively; use
  `vercel api /v10/projects/<id>/env?upsert=true --method POST --input file.json`.
- `supabase projects api-keys` masks secret keys unless `--reveal`.
- "Error while parsing config file: pnpm-lock.yaml" during `vercel deploy` is harmless.
- If the dev server loops reloading `/login`, restart it (stale HMR state).
- New Supabase tables get **no** Data API privileges by default: always grant explicitly.

## Open items (not yet done)

- [ ] Production end-to-end plan test with a temporary user (needs MCP), then Supabase security
      advisor.
- [ ] Legal: fill [placeholders] (company, CNPJ, contacts) and lawyer review.
- [ ] Age rules mismatch: energy test allows 15+, Terms say 16+ (18+ for photos).
- [ ] Account deletion (app-store requirement) must also delete storage files (body photos,
      avatars), which do not cascade.
- [ ] Cleanup job for orphaned uploads (abandoned wizard photos, old avatars).
- [ ] Sign-up, password reset, real email provider (e.g. Resend).
- [ ] Shared rate limiter (Upstash) before real traffic; in-memory today.
- [ ] Add `ANTHROPIC_API_KEY` + `AI_PROVIDER=anthropic` in Vercel when ready.

## Next: checkpoint 3

1. **Workout logging**: mark a plan day as done (`workout_sessions`, append-only, unique per user /
   plan / day / local date), show "today's workout" on Home and Training.
2. **XP and levels**: append-only `xp_events` with a unique (user, reason, source) constraint;
   award for logging workouts, completing the energy test, daily check-in; pure level curve.
   Consider a workout streak alongside the login streak.
3. **Freemium**: `entitlements` / plan tier, free quotas (coach messages per day, plans per month)
   enforced in the API/gateway, upgrade prompt in the UI; payments (RevenueCat for mobile, Stripe
   for web) later.
