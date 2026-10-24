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

## Mobile app (checkpoint 4, in progress)

`apps/mobile` (Expo SDK 57, Expo Router, native tabs with Lucide template icons). Run with
`pnpm mobile` (add `--clear` after installing packages; Metro caches failed lookups) and open in
Expo Go on the iPhone; Claude previews it with the `mobile-web` launch config (local stack, demo
user) since there's no simulator on Windows.

Done (2026-10-10):

- Login; native tabs Início, Treino, Dieta, Coach, Perfil.
- Home (Opal-inspired, Mobbin research): weekly workouts ring vs the plan with streak/level/
  protein pills, Mon-Sun week strip, today's workout with one-tap logging + haptics + XP,
  macro tiles, diet card, rotating story card, full-screen streak celebration at milestones.
- Profile (Sweatcoin-inspired): gradient hero, avatar with level badge, stats, last-7-days rings,
  body stats; cog opens Configurações.
- Configurações: photo (pick, crop, 512 px JPEG), name, @username, goal, language, units,
  privacy (photo consent revoke, legal links), sign out.
- Treino: plan overview, day picker (today's rotation day first), exercises, mark any day done
  (+ XP note), workout history (last 5 weeks), body analysis, progress photos (signed URLs,
  delete), polling while a plan generates. "Novo plano" wizard (pushed screen `new-plan`):
  questionnaire prefilled with the last answers, LGPD consent card, then camera or library photos
  (resized to ≤1600 px JPEG, EXIF stripped, signed upload), review, submit. Home and Treino reload
  on focus. Verified end to end in the web preview (local stack, mock AI).
- Expo project @enricolass/meucoach, EAS profiles in `apps/mobile/eas.json`; dev build uses the
  temporary identifier `dev.enricolass.meucoach.dev`; the store identifier is unset in
  `app.config.ts` until the app name/publisher is decided (before the first TestFlight upload).

- **Brand identity (2026-10-10, see [BRAND.md](../BRAND.md))**: "chalk and iron" palette, Archivo
  Expanded + Manrope, tokens in `packages/brand` (single source; web `globals.css` mirrors it,
  tested). Treino plan header is compact (summary in an ⓘ tooltip, "Perguntar para Meu Coach"
  button with twinkling sparkles → Coach tab), workouts are lettered A/B/C… and swipeable, plan
  numbers moved to a "Sobre o plano" card at the bottom. Settings → Aparência (Sistema / Claro /
  Escuro, per device). Plate-colored level badge, bold orange "Feito hoje", knurling texture on
  celebrations. Copy is already in the brand voice; a full copy pass was deferred.

- **Coach chat on mobile** (2026-10-10, shipped): Coach tab hub (intro, ask bar, suggestions,
  recent messages) and a full-screen chat (`/chat`, own header, keyboard-aware composer, typing
  dots, retry with the same Idempotency-Key, `?q=` to send a question). Production runs real AI:
  `AI_PROVIDER=anthropic`, `AI_MODEL_FAST=claude-haiku-5-5` for chat (cheap testing),
  `AI_MODEL_SMART` unset (plans/photos on Opus 5.5). Haiku has no server-side refusal fallback;
  the provider sends `fallbacks` only to models that support it.

- **Coach-first Home (2026-10-11)**: navigation is three tabs (Início, Treino, Dieta); Profile
  opens from the avatar (pushed screen, settings cog in its header); the Coach tab is gone and the
  chat is the full-screen `/chat`. Home's hero is the **daily coach check-in**
  (`POST /chat/check-in`, prompt `coach-checkin@1` on `coach-chat@3`): written once per local
  day from yesterday's/today's workout, a break, the questionnaire limitations, streak and the
  recent chat; stored in `chat_messages` (`kind = 'check_in'`, `quick_replies`) so replying
  continues the thread; template fallback if the AI fails. Below: today's workout, a compact week
  summary, the diet card. Coach replies render bold/lists (`parseChatMarkdown`).

Next, in order: **set and weight logging** (records/PRs, "aumentei 2,5 kg porque…"), **coach
notes memory** (facts extracted from chats), the check-in as a **push notification**, then **coach voice** (new `coach-chat` prompt version with the BRAND.md voice; consider
plan/workout context in the chat), then **Dieta**, the
**energy test** (the wizard's energy hint has no link until then); then
**freemium** with RevenueCat (needs an EAS development build, not Expo Go). The web UI is paused
(no new features).

To verify on the phone (not testable in the web preview): profile photo upload, progress photos
from the camera and library (permission prompts, action sheet), haptics, safe areas on iOS, the
A/B/C swipe feel, the appearance override on native UI (tab bar, alerts), font rendering on
Android. Fonts load at runtime (works in Expo Go); embed them with the `expo-font` config plugin
when moving to an EAS development build.
Known: the web preview logs "Unexpected text node" six times on the first page load (from before
Treino; an empty string rendered with `&&` somewhere); harmless, but worth finding.

## What is built

| Area         | Status                                                                                                                                                                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Foundation   | Monorepo, Hono API in Next.js, RLS + explicit grants, idempotency, rate limit, CI workflow                                                                                                                                                                                                                                     |
| Auth         | Email + password (no sign-up / reset UI yet; users created in the Supabase dashboard)                                                                                                                                                                                                                                          |
| i18n         | `packages/i18n` (pt-BR default, en), plural support, locale saved on profile                                                                                                                                                                                                                                                   |
| Profile      | Display name, unique @username, avatar (public bucket), goal; settings page (language, units, time zone, privacy, sign out)                                                                                                                                                                                                    |
| Energy       | Mifflin-St Jeor test, history, derived daily targets (`nutrition` module)                                                                                                                                                                                                                                                      |
| Coach chat   | Prompt `coach-chat@2` (language, goal guidance, targets, local time), mock in prod                                                                                                                                                                                                                                             |
| Diet         | `nutrition` module: questionnaire (meals/day, style, budget, cooking time, allergies, dislikes), AI diet plan (`diet-plan@1`, smart tier) in an Inngest job via the outbox, 2 options per meal, validated so any option combination lands within 12% of kcal and ≥85% of protein; needs the energy test; Dieta tab + Home card |
| Profile UI   | Profile page is read-only (identity, goal, level/streak, body, targets, plans); everything editable is in Settings (cog)                                                                                                                                                                                                       |
| Training     | Questionnaire, consent-gated body photos (private bucket), AI analysis + plan in an Inngest job via the outbox, plan UI, progress photos, delete / revoke                                                                                                                                                                      |
| Gamification | Append-only `activity_days` (login streak) + `xp_events` ledger (unique user/reason/source), pure level curve 50·n·(n−1), level card on Home                                                                                                                                                                                   |
| Workouts     | `workout_sessions` log (unique user/plan/day/local date), "today's workout" rotation on Home + Training, mark any plan day done                                                                                                                                                                                                |
| Legal        | Privacy Policy + Terms (pt-BR / en), **drafts** with [placeholders]                                                                                                                                                                                                                                                            |

Tests: ~236 unit (pure domain, prompts, i18n; the diet template is checked for 80 style × meals × body combinations), 63 integration (API + RLS + storage + jobs) against
local Supabase.

XP rules (`gamification/domain/levels.ts`): workout 50 (once per local day), daily check-in 5 (once
per day), energy test 20 (once per month). Awards are idempotent; `POST /training/workouts` logs the
workout first, then awards XP, so a retry after a partial failure completes the award.

## Environments and deploy

- **Local**: `pnpm dev` (Next :3000 + Inngest Dev Server :8288), Supabase via Docker
  (`pnpm db:start`). Local test user `demo@example.test` / `demo-password-123`.
- **Production**: https://meucoach-ai.vercel.app (Vercel project `meucoach-ai`, team
  `team_P15hwtXayUvgS69AzCU6WZOl`, functions in `gru1`), Supabase `gucypanajihwfocfpjzk`
  (`sa-east-1`), Inngest connected via the Vercel Marketplace (keys in Vercel env). Deployment
  protection is currently off.
- **Deploy procedure**: `pnpm ship` (clean `main` → `pnpm verify` → pending migrations via
  `pnpm db:push` → `git push origin main`, which Vercel deploys). After the deploy is live:
  `pnpm health` and `pnpm inngest:status`. If Inngest stopped
  calling the app, re-sync: `curl -X PUT https://meucoach-ai.vercel.app/api/inngest`.
- **Git**: `main` is pushed to `enricosaito/meucoach-ai` and CI is green. Every push to `main` also
  triggers a Vercel production deploy (repo connected), so run `pnpm db:push` BEFORE pushing
  code that needs a new migration.

## Gotchas seen in this project

- **Docker Desktop won't start** (unreadable socket files on this Windows Insider build): stop
  Docker, rename `%LOCALAPPDATA%\Docker\run` and `%LOCALAPPDATA%\docker-secrets-engine` to
  `*.stale-<timestamp>`, recreate an empty `Docker\run`, `docker desktop start`.
- **Supabase CLI login keeps getting replaced** by another account on this machine (403 on
  "Initialising login role"). Use `pnpm db:push*`, which take the owner's token from
  the root `.env.local` instead of the CLI login.
- Vercel CLI was once switched to another account (`ripaames-2699`); check `vercel whoami`.
- Git Bash mangles paths: `export MSYS_NO_PATHCONV=1` before `vercel curl /api/...`.
- `vercel env add ... preview` fails non-interactively; use
  `vercel api /v10/projects/<id>/env?upsert=true --method POST --input file.json`.
- `supabase projects api-keys` masks secret keys unless `--reveal`.
- "Error while parsing config file: pnpm-lock.yaml" during `vercel deploy` is harmless.
- If the dev server loops reloading `/login`, restart it (stale HMR state).
- New Supabase tables get **no** Data API privileges by default: always grant explicitly.
- After `pnpm db:reset` the local storage API can fail with `42P10` (ON CONFLICT without a matching
  index), breaking avatar/photo integration tests: `pnpm db:stop && pnpm db:start` fixes it. The
  reset also wipes the demo user (it is not in `seed.sql`); recreate it with the local admin API.
- Next 16 allows one `next dev` per app folder; a second session must reuse the running server.
- Mobile safe areas: on iOS, native tabs force automatic content insets on a tab's first
  ScrollView (status bar + tab bar), even with `contentInsetAdjustmentBehavior="never"`. Never
  add `insets.top` there yourself (blank band at the top); use `Screen` in
  `apps/mobile/src/components/ui.tsx`, which pads per platform. The web preview doesn't show
  iOS inset bugs: check on the phone.
- Hermes (iOS) lacks some Intl APIs, e.g. `Intl.PluralRules`; shared packages must not assume
  them (i18n has a CLDR fallback).

## Open items (not yet done)

- [x] Production end-to-end plan test passed (2026-10-10): plan generated by the Inngest job at
      16:28 UTC. Inngest had stopped calling the app ~15:29–16:17 UTC after an auto-sync and recovered
      after a manual `PUT /api/inngest`. Now monitored: `pnpm health` + the GitHub monitor workflow.
- [ ] Paused (2026-10-24): the outbox dispatcher's every-minute safety-net cron is removed (it
      was ~43k Inngest runs/month, ~90% of the plan) and the monitor workflow's schedule is off.
      The API's nudge still dispatches. On resume: re-add a cron (e.g. `*/15 * * * *`) in
      `packages/jobs/src/functions/index.ts`, restore the schedule in `monitor.yml`, re-sync Inngest.
- [ ] Delete the e2e test user `e2e-temp-20261010@example.test` from production (cascades to its
      profile and plan).
- [ ] Security advisor (2026-10-10): WARN "Leaked password protection disabled" (Auth settings) and
      INFO "RLS enabled, no policy" on `ai_calls`, `idempotency_keys`, `outbox_events` (intended:
      server-only tables).
- [ ] Code for checkpoint 3 (workouts/XP, diet, settings move) is committed locally but not pushed
      to `main`. All migrations are already in production (2026-10-10, verified grants/RLS).
- [ ] Diet: the mock template's portions are only good enough to pass validation (dev/test); real
      quality depends on the AI. Ideas: diet in the coach's context, swap a single food, weekly
      variety, grocery list by category.
- [ ] Legal: fill [placeholders] (company, CNPJ, contacts) and lawyer review.
- [ ] Age rules mismatch: energy test allows 15+, Terms say 16+ (18+ for photos).
- [ ] Account deletion (app-store requirement) must also delete storage files (body photos,
      avatars), which do not cascade.
- [ ] Cleanup job for orphaned uploads (abandoned wizard photos, old avatars).
- [ ] Sign-up, password reset, real email provider (e.g. Resend).
- [ ] Shared rate limiter (Upstash) before real traffic; in-memory today.
- [ ] Add `ANTHROPIC_API_KEY` + `AI_PROVIDER=anthropic` in Vercel when ready.

## Next: rest of checkpoint 3

1. Workout logging and XP/levels are done (local only, not deployed). Left over: workout streak or
   weekly goal (days per week from the questionnaire), undo a mis-tapped log, workout history,
   level-up celebration.
2. **Freemium**: `entitlements` / plan tier, free quotas (coach messages per day, plans per month)
   enforced in the API/gateway, upgrade prompt in the UI; payments (RevenueCat for mobile, Stripe
   for web) later.
