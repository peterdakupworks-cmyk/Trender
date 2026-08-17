-- =====================================================================
-- TRENDER — PHASE 3A FIX (revised): ATOMIC CREATOR REGISTRATION
-- =====================================================================
-- REVISION NOTE: the first version of this file assumed migration
-- 0002_creator_registration_foundation.sql had already been applied (it
-- renames creator_profiles.follower_count -> submitted_follower_count,
-- renames creator_social_accounts.handle -> profile_url, and introduces
-- the public.verification_status / public.account_status enum types).
--
-- The live database only has 0001_phase3a_foundation.sql applied. 0002
-- never successfully ran there (that's exactly why "type
-- public.verification_status does not exist" was raised — that type is
-- only created inside 0002). This revision targets the SCHEMA THAT
-- ACTUALLY EXISTS today and creates no new enum type.
--
-- Which existing column is "the status" and why:
--   public.creator_profiles.identity_status
--   — text, NOT NULL, DEFAULT 'pending' (defined in 0001)
--   This already does exactly what's required: every new creator profile
--   starts at 'pending' automatically (via its column default — this
--   function doesn't even need to set it explicitly), and it's a plain
--   text column, so nothing here depends on an enum that may or may not
--   exist. An admin can later run:
--     update public.creator_profiles set identity_status = 'approved' where user_id = '...';
--   (or 'rejected'). No schema change needed for that — it's just a text
--   value. public.creator_profiles.account_status (also plain text,
--   default 'active') is a separate, pre-existing field for suspension/
--   activity state and is intentionally left alone here.
--
-- Also note: since 0002 didn't run, creator_social_accounts still only
-- has a `handle` column (not `profile_url`/`normalized_profile_url`), so
-- this function stores the submitted Instagram/TikTok links there as-is.
-- The stronger duplicate-account protection and required-both-platforms
-- enforcement from 0002 do NOT exist on this database yet. That's a
-- separate, optional follow-up — not something this fix silently assumes.
-- =====================================================================

create or replace function public.complete_creator_registration(
  p_full_name text,
  p_username text,
  p_phone text,
  p_country text,
  p_state text,
  p_city text,
  p_instagram_url text,
  p_tiktok_url text,
  p_submitted_follower_count integer
)
returns public.creator_profiles
language plpgsql
security invoker -- runs AS the calling user, so every existing RLS policy still applies normally
as $$
declare
  v_uid uuid := auth.uid();
  v_result public.creator_profiles;
begin
  if v_uid is null then
    raise exception 'You must be signed in to complete creator registration.';
  end if;

  update public.profiles
  set full_name = coalesce(p_full_name, full_name),
      username = coalesce(p_username, username),
      phone = coalesce(p_phone, phone),
      country = coalesce(p_country, country),
      state = coalesce(p_state, state),
      city = coalesce(p_city, city)
  where id = v_uid;

  if not found then
    raise exception 'No profile row exists for this user yet — the auth signup trigger may not have run.';
  end if;

  -- creator_social_accounts (0001 shape): id, creator_id, platform, handle, created_at.
  -- unique(creator_id, platform) from 0001 makes this upsert safe and idempotent.
  insert into public.creator_social_accounts (creator_id, platform, handle)
  values
    (v_uid, 'instagram', p_instagram_url),
    (v_uid, 'tiktok', p_tiktok_url)
  on conflict (creator_id, platform) do update
    set handle = excluded.handle;

  -- creator_profiles (0001 shape): user_id, follower_count, tier,
  -- account_status, trender_score, identity_status, created_at, updated_at.
  -- identity_status is NOT set here on purpose:
  --   - on first INSERT it uses its column default ('pending') automatically.
  --   - on a later re-run (ON CONFLICT), we deliberately do NOT touch it, so
  --     an admin's earlier 'approved'/'rejected' decision is never silently
  --     reset back to 'pending' just because this function ran again.
  insert into public.creator_profiles (user_id, follower_count)
  values (v_uid, p_submitted_follower_count)
  on conflict (user_id) do update
    set follower_count = excluded.follower_count
  returning * into v_result;

  return v_result;
end;
$$;

-- Only a logged-in user can call this, and only for themselves (auth.uid()
-- inside the function is always the caller's own id — there's no parameter
-- that lets you target someone else's account). Anonymous callers cannot
-- execute this at all — RLS is not weakened or bypassed anywhere here.
revoke all on function public.complete_creator_registration(text, text, text, text, text, text, text, text, integer) from public;
grant execute on function public.complete_creator_registration(text, text, text, text, text, text, text, text, integer) to authenticated;

-- =====================================================================
-- Self-service diagnostic — lets a logged-in user (or you, from the SQL
-- editor as an admin) check exactly where their own registration stands,
-- without exposing any other user's data. Uses only existing text columns,
-- no enum types.
-- =====================================================================

create or replace function public.debug_my_creator_registration_status()
returns table (
  has_profile boolean,
  has_creator_profile boolean,
  has_instagram boolean,
  has_tiktok boolean,
  identity_status text,
  account_status text
)
language sql
security invoker
stable
as $$
  select
    exists (select 1 from public.profiles where id = auth.uid()),
    exists (select 1 from public.creator_profiles where user_id = auth.uid()),
    exists (select 1 from public.creator_social_accounts where creator_id = auth.uid() and platform = 'instagram'),
    exists (select 1 from public.creator_social_accounts where creator_id = auth.uid() and platform = 'tiktok'),
    (select cp.identity_status from public.creator_profiles cp where cp.user_id = auth.uid()),
    (select cp.account_status from public.creator_profiles cp where cp.user_id = auth.uid());
$$;

revoke all on function public.debug_my_creator_registration_status() from public;
grant execute on function public.debug_my_creator_registration_status() to authenticated;
