-- Training: questionnaire, body scans (progress photos + AI analysis), AI workout plans,
-- explicit consents, and the transactional outbox for background jobs.

-- ---------------------------------------------------------------------------
-- platform: transactional outbox
-- ---------------------------------------------------------------------------

create table public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  dispatched_at timestamptz
);

create index outbox_events_undispatched_idx
  on public.outbox_events (created_at) where dispatched_at is null;

-- ---------------------------------------------------------------------------
-- profile module: explicit consents (LGPD). Append-only; revocation sets revoked_at.
-- ---------------------------------------------------------------------------

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('body_photos')),
  version int not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index consents_user_kind_idx on public.consents (user_id, kind, granted_at desc);
-- At most one active consent per kind.
create unique index consents_one_active_idx on public.consents (user_id, kind) where revoked_at is null;

-- ---------------------------------------------------------------------------
-- training module
-- ---------------------------------------------------------------------------

create table public.training_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  experience text not null check (experience in ('beginner', 'intermediate', 'advanced')),
  days_per_week int not null check (days_per_week between 2 and 6),
  session_minutes int not null check (session_minutes in (30, 45, 60, 75, 90)),
  equipment text not null check (equipment in ('full_gym', 'home_dumbbells', 'bodyweight')),
  limitations text check (char_length(limitations) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger training_profiles_set_updated_at
before update on public.training_profiles
for each row execute function public.set_updated_at();

-- A set of 1–3 progress photos and its AI analysis. Kept for progress comparison until the user
-- deletes it (or revokes photo consent, which deletes all of them).
create table public.body_scans (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'unusable', 'failed')),
  front_path text,
  side_path text,
  back_path text,
  analysis jsonb,
  model text,
  prompt_version text,
  ai_call_id uuid references public.ai_calls (id) on delete set null,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (coalesce(front_path, side_path, back_path) is not null)
);

create index body_scans_user_created_idx on public.body_scans (user_id, created_at desc);

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'generating', 'ready', 'failed')),
  body_scan_id uuid references public.body_scans (id) on delete set null,
  inputs jsonb not null,
  plan jsonb,
  model text,
  prompt_version text,
  ai_call_id uuid references public.ai_calls (id) on delete set null,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index workout_plans_user_created_idx on public.workout_plans (user_id, created_at desc);

-- Saves the questionnaire, the optional body scan, a pending plan and the outbox event in ONE
-- transaction, so a plan request is never lost and never half-written.
create or replace function public.training_request_plan(
  p_user_id uuid,
  p_training_profile jsonb,
  p_scan jsonb,
  p_inputs jsonb,
  p_request_id text
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_plan_id uuid;
  v_scan_id uuid := (p_scan ->> 'id')::uuid;
begin
  insert into public.training_profiles as tp
    (user_id, experience, days_per_week, session_minutes, equipment, limitations)
  values (
    p_user_id,
    p_training_profile ->> 'experience',
    (p_training_profile ->> 'daysPerWeek')::int,
    (p_training_profile ->> 'sessionMinutes')::int,
    p_training_profile ->> 'equipment',
    nullif(p_training_profile ->> 'limitations', '')
  )
  on conflict (user_id) do update set
    experience = excluded.experience,
    days_per_week = excluded.days_per_week,
    session_minutes = excluded.session_minutes,
    equipment = excluded.equipment,
    limitations = excluded.limitations;

  if v_scan_id is not null then
    insert into public.body_scans (id, user_id, front_path, side_path, back_path)
    values (
      v_scan_id,
      p_user_id,
      p_scan ->> 'frontPath',
      p_scan ->> 'sidePath',
      p_scan ->> 'backPath'
    );
  end if;

  insert into public.workout_plans (user_id, body_scan_id, inputs)
  values (p_user_id, v_scan_id, p_inputs)
  returning id into v_plan_id;

  insert into public.outbox_events (type, payload)
  values (
    'training/plan.requested',
    jsonb_build_object(
      'planId', v_plan_id,
      'userId', p_user_id,
      'bodyScanId', v_scan_id,
      'requestId', p_request_id
    )
  );

  return v_plan_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security + privileges (explicit allow-list)
-- ---------------------------------------------------------------------------

alter table public.outbox_events enable row level security;
alter table public.consents enable row level security;
alter table public.training_profiles enable row level security;
alter table public.body_scans enable row level security;
alter table public.workout_plans enable row level security;

create policy "consents: read own"
  on public.consents for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "training_profiles: read own"
  on public.training_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "body_scans: read own"
  on public.body_scans for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "workout_plans: read own"
  on public.workout_plans for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.outbox_events, public.consents, public.training_profiles,
  public.body_scans, public.workout_plans from anon, authenticated;

grant select on public.consents, public.training_profiles, public.body_scans,
  public.workout_plans to authenticated;

grant select, insert, update, delete on public.outbox_events, public.consents,
  public.training_profiles, public.body_scans, public.workout_plans to service_role;

revoke execute on function public.training_request_plan(uuid, jsonb, jsonb, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.training_request_plan(uuid, jsonb, jsonb, jsonb, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- Storage: private bucket for progress photos, path {user_id}/{scan_id}/{view}.{ext}
-- Uploads only through signed upload URLs issued by the API; users can read their own folder.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('body-photos', 'body-photos', false, 10485760, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do nothing;

create policy "body-photos: read own folder"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'body-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
