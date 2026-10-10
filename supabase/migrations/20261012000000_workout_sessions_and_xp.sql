-- Workout logging (training) and XP (gamification). Both are append-only logs; "today's workout",
-- totals and levels are derived from them and can always be recomputed.

-- ---------------------------------------------------------------------------
-- training module: completed workouts. One row per plan day per local calendar day.
-- ---------------------------------------------------------------------------

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.workout_plans (id) on delete cascade,
  day_index int not null check (day_index between 0 and 13),
  -- Snapshot of the day title, so history still reads well after the plan changes.
  day_title text not null check (char_length(day_title) <= 200),
  local_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, plan_id, day_index, local_date)
);

create index workout_sessions_user_created_idx
  on public.workout_sessions (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- gamification module: XP ledger. (user, reason, source) is unique, so every award is
-- idempotent: retries and repeated calls never grant the same XP twice.
-- ---------------------------------------------------------------------------

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (reason in ('workout_logged', 'daily_check_in', 'energy_test')),
  source text not null check (char_length(source) between 1 and 100),
  amount int not null check (amount > 0 and amount <= 1000),
  created_at timestamptz not null default now(),
  unique (user_id, reason, source)
);

create index xp_events_user_created_idx on public.xp_events (user_id, created_at desc);

-- Total XP for one user, summed in the database (PostgREST aggregates are disabled).
create or replace function public.gamification_xp_total(p_user_id uuid)
returns bigint
language sql
stable
set search_path = ''
as $$
  select coalesce(sum(amount), 0)::bigint from public.xp_events where user_id = p_user_id;
$$;

-- ---------------------------------------------------------------------------
-- Row level security + privileges (explicit allow-list)
-- ---------------------------------------------------------------------------

alter table public.workout_sessions enable row level security;
alter table public.xp_events enable row level security;

create policy "workout_sessions: read own"
  on public.workout_sessions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "xp_events: read own"
  on public.xp_events for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.workout_sessions, public.xp_events from anon, authenticated;
grant select on public.workout_sessions, public.xp_events to authenticated;
grant select, insert, delete on public.workout_sessions, public.xp_events to service_role;

revoke execute on function public.gamification_xp_total(uuid) from public, anon, authenticated;
grant execute on function public.gamification_xp_total(uuid) to service_role;
