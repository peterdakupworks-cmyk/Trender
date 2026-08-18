-- Universal TRENDER account profile fields
-- Basic identity is collected once at account creation and reused by Creator
-- and Business / Brand capabilities.

alter table public.profiles
  add column if not exists gender text,
  add column if not exists date_of_birth date;

alter table public.profiles
  drop constraint if exists profiles_gender_check;

alter table public.profiles
  add constraint profiles_gender_check
  check (gender is null or gender in ('male', 'female', 'prefer_not_to_say'));

-- Sync universal signup metadata from auth.users into the existing profile row.
-- This is intentionally an AFTER INSERT trigger so it works alongside the
-- project's original profile-creation trigger and also survives email
-- confirmation being enabled.
create or replace function public.sync_universal_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, full_name, country, state, gender, date_of_birth
  ) values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    coalesce(nullif(trim(coalesce(new.raw_user_meta_data ->> 'country', '')), ''), 'Nigeria'),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'state', '')), ''),
    nullif(new.raw_user_meta_data ->> 'gender', ''),
    nullif(new.raw_user_meta_data ->> 'date_of_birth', '')::date
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    country = coalesce(excluded.country, public.profiles.country),
    state = coalesce(excluded.state, public.profiles.state),
    gender = coalesce(excluded.gender, public.profiles.gender),
    date_of_birth = coalesce(excluded.date_of_birth, public.profiles.date_of_birth),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_universal_profile_sync on auth.users;
create trigger on_auth_user_universal_profile_sync
  after insert on auth.users
  for each row execute function public.sync_universal_profile_from_auth();
