-- Nutrition: diet questionnaire and AI diet plans, generated in a background job via the outbox.

create table public.diet_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  meals_per_day int not null check (meals_per_day between 3 and 6),
  diet_style text not null check (diet_style in ('omnivore', 'vegetarian', 'vegan', 'pescatarian')),
  budget text not null check (budget in ('economic', 'moderate', 'flexible')),
  cooking_time text not null check (cooking_time in ('minimal', 'some', 'enjoy')),
  -- Food allergies and intolerances can be health data (LGPD): see the Privacy Policy.
  allergies text check (char_length(allergies) <= 300),
  dislikes text check (char_length(dislikes) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger diet_profiles_set_updated_at
before update on public.diet_profiles
for each row execute function public.set_updated_at();

create table public.diet_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'generating', 'ready', 'failed')),
  inputs jsonb not null,
  plan jsonb,
  model text,
  prompt_version text,
  ai_call_id uuid references public.ai_calls (id) on delete set null,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index diet_plans_user_created_idx on public.diet_plans (user_id, created_at desc);

-- Saves the questionnaire, a pending plan and the outbox event in ONE transaction.
create or replace function public.nutrition_request_diet_plan(
  p_user_id uuid,
  p_diet_profile jsonb,
  p_inputs jsonb,
  p_request_id text
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_plan_id uuid;
begin
  insert into public.diet_profiles as dp
    (user_id, meals_per_day, diet_style, budget, cooking_time, allergies, dislikes)
  values (
    p_user_id,
    (p_diet_profile ->> 'mealsPerDay')::int,
    p_diet_profile ->> 'dietStyle',
    p_diet_profile ->> 'budget',
    p_diet_profile ->> 'cookingTime',
    nullif(p_diet_profile ->> 'allergies', ''),
    nullif(p_diet_profile ->> 'dislikes', '')
  )
  on conflict (user_id) do update set
    meals_per_day = excluded.meals_per_day,
    diet_style = excluded.diet_style,
    budget = excluded.budget,
    cooking_time = excluded.cooking_time,
    allergies = excluded.allergies,
    dislikes = excluded.dislikes;

  insert into public.diet_plans (user_id, inputs)
  values (p_user_id, p_inputs)
  returning id into v_plan_id;

  insert into public.outbox_events (type, payload)
  values (
    'nutrition/diet-plan.requested',
    jsonb_build_object('planId', v_plan_id, 'userId', p_user_id, 'requestId', p_request_id)
  );

  return v_plan_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security + privileges (explicit allow-list)
-- ---------------------------------------------------------------------------

alter table public.diet_profiles enable row level security;
alter table public.diet_plans enable row level security;

create policy "diet_profiles: read own"
  on public.diet_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "diet_plans: read own"
  on public.diet_plans for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.diet_profiles, public.diet_plans from anon, authenticated;
grant select on public.diet_profiles, public.diet_plans to authenticated;
grant select, insert, update, delete on public.diet_profiles, public.diet_plans to service_role;

revoke execute on function public.nutrition_request_diet_plan(uuid, jsonb, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.nutrition_request_diet_plan(uuid, jsonb, jsonb, text)
  to service_role;
