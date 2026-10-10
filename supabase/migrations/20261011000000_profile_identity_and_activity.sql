-- Profile identity (unique username, avatar) and the daily activity log behind login streaks.

-- ---------------------------------------------------------------------------
-- profile module: username + avatar
-- ---------------------------------------------------------------------------

-- Turns any text into a valid, unused username: lowercase [a-z0-9_.], 3–20 chars, unique.
create or replace function public.generate_username(base text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  candidate text;
  cleaned text := left(regexp_replace(lower(coalesce(base, '')), '[^a-z0-9_.]', '', 'g'), 15);
begin
  if char_length(cleaned) < 3 then
    cleaned := 'user' || cleaned;
  end if;
  candidate := cleaned;
  while exists (select 1 from public.profiles where username = candidate) loop
    candidate := cleaned || (1000 + floor(random() * 9000))::int::text;
  end loop;
  return candidate;
end;
$$;

revoke execute on function public.generate_username(text) from public, anon, authenticated;

alter table public.profiles
  add column username text,
  add column avatar_path text;

-- Backfill: existing users get a username from their current name; the auto-generated name
-- (email prefix) is cleared so greetings fall back to the username until they set one.
do $$
declare
  r record;
begin
  for r in
    select p.id, p.display_name, u.email
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at
  loop
    update public.profiles
    set username = public.generate_username(split_part(coalesce(r.email, ''), '@', 1)),
        display_name = case
          when r.display_name = split_part(coalesce(r.email, ''), '@', 1) then null
          else r.display_name
        end
    where id = r.id;
  end loop;
end;
$$;

alter table public.profiles
  alter column username set not null,
  add constraint profiles_username_format check (username ~ '^[a-z0-9_.]{3,20}$'),
  add constraint profiles_username_key unique (username);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_locale text := new.raw_user_meta_data ->> 'locale';
begin
  insert into public.profiles (id, username, display_name, locale)
  values (
    new.id,
    public.generate_username(split_part(coalesce(new.email, ''), '@', 1)),
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    case when requested_locale in ('pt-BR', 'en') then requested_locale else 'pt-BR' end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Avatars: public bucket (shown across the app, unguessable paths), 2 MB, images only.
-- Uploads only through signed URLs issued by the API; there is no client insert policy.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- gamification module: append-only log of days the user was active (local calendar days).
-- Streaks are derived from it and can always be recomputed.
-- ---------------------------------------------------------------------------

create table public.activity_days (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.activity_days enable row level security;

create policy "activity_days: read own"
  on public.activity_days for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.activity_days from anon, authenticated;
grant select on public.activity_days to authenticated;
grant select, insert, delete on public.activity_days to service_role;
