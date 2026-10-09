-- Foundation schema: profiles, metabolic assessments, coach chat, AI call log, idempotency.
--
-- Security model:
--   * Clients (anon/authenticated) may only SELECT their own rows, and only on user-facing tables.
--   * All writes go through the API, which uses the service role (bypasses RLS) and scopes every
--     query by the authenticated user ID.
--   * Table privileges are an explicit allow-list (see the end of this file) on top of RLS.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profile module
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  goals jsonb not null default '{}'::jsonb,
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create a profile row for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(split_part(coalesce(new.email, ''), '@', 1), ''));
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Append-only history of Mifflin-St Jeor tests. The latest row is the current estimate.
create table public.metabolic_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  formula text not null default 'mifflin_st_jeor',
  formula_version int not null,
  sex text not null check (sex in ('male', 'female')),
  age_years int not null check (age_years between 15 and 100),
  height_cm numeric(5, 1) not null check (height_cm between 100 and 250),
  weight_kg numeric(5, 1) not null check (weight_kg between 30 and 350),
  activity_level text not null
    check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  bmr_kcal int not null,
  tdee_kcal int not null,
  created_at timestamptz not null default now()
);

create index metabolic_assessments_user_created_idx
  on public.metabolic_assessments (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- coaching module
-- ---------------------------------------------------------------------------

create table public.ai_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  feature text not null,
  provider text not null,
  model text not null,
  prompt_version text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  latency_ms int not null,
  status text not null check (status in ('succeeded', 'failed')),
  error text,
  request_id text,
  created_at timestamptz not null default now()
);

create index ai_calls_user_created_idx on public.ai_calls (user_id, created_at desc);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 8000),
  ai_call_id uuid references public.ai_calls (id) on delete set null,
  prompt_version text,
  created_at timestamptz not null default now()
);

create index chat_messages_user_created_idx on public.chat_messages (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- platform: idempotency
-- ---------------------------------------------------------------------------

create table public.idempotency_keys (
  user_id uuid not null references public.profiles (id) on delete cascade,
  key text not null check (char_length(key) between 1 and 255),
  request_hash text not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  response_status int,
  response_body jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, key)
);

create index idempotency_keys_created_idx on public.idempotency_keys (created_at);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.metabolic_assessments enable row level security;
alter table public.chat_messages enable row level security;
alter table public.ai_calls enable row level security;
alter table public.idempotency_keys enable row level security;

-- Read-own policies only. There are intentionally NO insert/update/delete policies.
create policy "profiles: read own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "metabolic_assessments: read own"
  on public.metabolic_assessments for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "chat_messages: read own"
  on public.chat_messages for select to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Table privileges (explicit allow-list)
-- ---------------------------------------------------------------------------
-- New tables start with no Data API privileges, so every table must be granted explicitly.
-- Defense in depth on top of RLS: `authenticated` only ever gets SELECT, `anon` gets nothing,
-- and internal tables (ai_calls, idempotency_keys) are reachable only by the service role.

revoke all on public.profiles, public.metabolic_assessments, public.chat_messages,
  public.ai_calls, public.idempotency_keys from anon, authenticated;

grant select on public.profiles, public.metabolic_assessments, public.chat_messages
  to authenticated;

grant select, insert, update, delete
  on public.profiles, public.metabolic_assessments, public.chat_messages,
     public.ai_calls, public.idempotency_keys
  to service_role;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
