-- Preferred language for the app UI and the AI coach. Brazil is the primary market.

alter table public.profiles
  add column locale text not null default 'pt-BR' check (locale in ('pt-BR', 'en'));

-- New users can pass a locale in their sign-up metadata (e.g. from the device language).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_locale text := new.raw_user_meta_data ->> 'locale';
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    case when requested_locale in ('pt-BR', 'en') then requested_locale else 'pt-BR' end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
