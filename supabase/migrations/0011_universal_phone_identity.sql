-- Universal account phone identity
-- The phone number is collected once at universal signup and reused by
-- Creator and Business / Brand capabilities. A non-null phone may belong to
-- only one universal account.

alter table public.profiles
  add column if not exists phone text;

create unique index if not exists profiles_phone_unique_idx
  on public.profiles (phone)
  where phone is not null and btrim(phone) <> '';

create or replace function public.sync_universal_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, full_name, phone, country, state, gender, date_of_birth
  ) values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), ''),
    coalesce(nullif(trim(coalesce(new.raw_user_meta_data ->> 'country', '')), ''), 'Nigeria'),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'state', '')), ''),
    nullif(new.raw_user_meta_data ->> 'gender', ''),
    nullif(new.raw_user_meta_data ->> 'date_of_birth', '')::date
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    country = coalesce(excluded.country, public.profiles.country),
    state = coalesce(excluded.state, public.profiles.state),
    gender = coalesce(excluded.gender, public.profiles.gender),
    date_of_birth = coalesce(excluded.date_of_birth, public.profiles.date_of_birth),
    updated_at = now();
  return new;
end;
$$;

-- Recreate the trigger so the universal phone is copied at signup.
drop trigger if exists on_auth_user_universal_profile_sync on auth.users;
create trigger on_auth_user_universal_profile_sync
  after insert on auth.users
  for each row execute function public.sync_universal_profile_from_auth();
