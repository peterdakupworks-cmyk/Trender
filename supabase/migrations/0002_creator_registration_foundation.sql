-- =====================================================================
-- TRENDER — PHASE 3A (round 2): CREATOR REGISTRATION FOUNDATION
-- =====================================================================
-- Builds on 0001_phase3a_foundation.sql. Adds:
--   - profiles.phone
--   - Required Instagram + TikTok at creator registration, with normalized-
--     URL duplicate-account prevention (DB-level, not just frontend)
--   - submitted_follower_count vs. verified creator_tier
--   - verification_status / account_status / risk fields, all protected
--     from client writes except through a trusted server process
--
-- Still explicitly OUT of scope: automatic follower verification, fraud
-- scoring logic, admin dashboard, Phase 3B campaign engine.
-- =====================================================================

-- =====================================================================
-- 1. NEW ENUMS
-- =====================================================================

create type public.verification_status as enum ('PENDING', 'VERIFIED', 'REJECTED');
create type public.account_status as enum ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED');
create type public.risk_status as enum ('CLEAR', 'REVIEW', 'FLAGGED');

-- =====================================================================
-- 0. FIX: role-integrity trigger from 0001 was too strict
-- =====================================================================
-- The original trigger blocked ANY change to profiles.role after signup,
-- which also accidentally blocked the legitimate one-time "I'm a Creator" /
-- "I'm an Advertiser" choice a new user makes right after signup (every new
-- auth user starts as 'creator' by default via the bootstrap trigger).
-- Fix: allow exactly one transition away from the untouched 'creator'
-- default, to 'creator' or 'advertiser' only — never to 'admin', and never
-- a second change after that.
create or replace function public.enforce_role_integrity()
returns trigger language plpgsql as $$
begin
  if public.is_service_role() then
    return new;
  end if;

  if new.role = 'admin' then
    raise exception 'Only a trusted server process can assign the admin role.';
  end if;

  if tg_op = 'UPDATE' and new.role <> old.role then
    if old.role <> 'creator' then
      raise exception 'Your account type has already been set and cannot be changed here.';
    end if;
    if new.role not in ('creator', 'advertiser') then
      raise exception 'Invalid account type.';
    end if;
  end if;

  return new;
end;
$$;

-- =====================================================================
-- 2. PROFILES: add phone, enforce uniqueness where present
-- =====================================================================

alter table public.profiles add column phone text;

create unique index profiles_phone_unique_idx on public.profiles (phone) where phone is not null;
create unique index profiles_email_unique_idx on public.profiles (email) where email is not null;
-- (auth.users.email is already unique at the Supabase Auth level; this is
-- defense-in-depth for the public.profiles copy of that email.)

-- =====================================================================
-- 3. CREATOR_PROFILES: submitted vs. verified data, verification/account/risk
-- =====================================================================

alter table public.creator_profiles rename column follower_count to submitted_follower_count;
comment on column public.creator_profiles.submitted_follower_count is
  'Self-reported by the creator at registration. NOT a verified number — do not treat as ground truth until verification_status = VERIFIED.';

alter table public.creator_profiles drop column identity_status; -- superseded by verification_status below

alter table public.creator_profiles
  add column verification_status public.verification_status not null default 'PENDING',
  add column verification_date timestamptz,
  add column verification_notes text,
  add column rejection_reason text,
  add column risk_status public.risk_status not null default 'CLEAR',
  add column risk_score integer not null default 0 check (risk_score >= 0),
  add column last_verification_check timestamptz;

alter table public.creator_profiles
  alter column account_status drop default,
  alter column account_status type public.account_status using (
    case account_status
      when 'active' then 'ACTIVE'
      else 'PENDING'
    end
  )::public.account_status,
  alter column account_status set default 'PENDING';

-- Minimum-followers eligibility notice is enforced in the UI ("Creators must
-- have at least 500 followers to participate"); this check is a soft floor
-- at the data layer so an obviously-invalid submission can't be stored.
alter table public.creator_profiles
  add constraint submitted_follower_count_nonnegative check (submitted_follower_count >= 0);

-- Replace the earlier tier-only integrity trigger with the fuller set of
-- protected fields: a creator can update their own submitted_follower_count
-- (they're allowed to correct/resubmit it), but every verification/account/
-- risk field is admin/service-role only, and always starts at the safe
-- default regardless of what a client tries to insert.
drop trigger if exists creator_profiles_enforce_tier on public.creator_profiles;
drop function if exists public.enforce_creator_tier_integrity();

create or replace function public.enforce_creator_profile_integrity()
returns trigger language plpgsql as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- A new creator can never register themselves as already verified/active/reviewed.
    new.tier := 'starter';
    new.verification_status := 'PENDING';
    new.verification_date := null;
    new.verification_notes := null;
    new.rejection_reason := null;
    new.account_status := 'PENDING';
    new.risk_status := 'CLEAR';
    new.risk_score := 0;
    new.last_verification_check := null;
    return new;
  end if;

  -- UPDATE: lock every admin-controlled field to its previous value.
  if new.tier <> old.tier
    or new.verification_status <> old.verification_status
    or new.account_status <> old.account_status
    or new.risk_status <> old.risk_status
    or new.risk_score <> old.risk_score
    or coalesce(new.verification_date, 'epoch') <> coalesce(old.verification_date, 'epoch')
    or coalesce(new.verification_notes, '') <> coalesce(old.verification_notes, '')
    or coalesce(new.rejection_reason, '') <> coalesce(old.rejection_reason, '')
    or coalesce(new.last_verification_check, 'epoch') <> coalesce(old.last_verification_check, 'epoch')
  then
    raise exception 'This field can only be changed by an administrator.';
  end if;

  return new;
end;
$$;

create trigger creator_profiles_enforce_integrity
  before insert or update on public.creator_profiles
  for each row execute function public.enforce_creator_profile_integrity();

-- =====================================================================
-- 4. CREATOR SOCIAL ACCOUNTS: required IG+TikTok, normalized-URL dedup
-- =====================================================================

-- Normalizes a social profile URL/handle for duplicate detection:
-- lowercase, strip protocol/www, strip trailing slash and query string.
create or replace function public.normalize_social_url(p_url text)
returns text language sql immutable as $$
  select regexp_replace(
    regexp_replace(
      regexp_replace(lower(trim(p_url)), '^(https?://)?(www\.)?', ''),
      '[/?].*$', ''
    ),
    '^@', ''
  );
$$;

alter table public.creator_social_accounts rename column handle to username;
alter table public.creator_social_accounts alter column username drop not null;

alter table public.creator_social_accounts
  add column profile_url text,
  add column submitted_follower_count integer,
  add column verification_status public.verification_status not null default 'PENDING',
  add column updated_at timestamptz not null default now();

-- Backfill profile_url for any pre-existing rows (defensive; none expected
-- yet since this is still pre-production) so the NOT NULL below is safe.
update public.creator_social_accounts set profile_url = coalesce(profile_url, username) where profile_url is null;

alter table public.creator_social_accounts alter column profile_url set not null;

alter table public.creator_social_accounts
  add column normalized_profile_url text generated always as (public.normalize_social_url(profile_url)) stored;

-- The core duplicate-account defense: the SAME Instagram/TikTok account can
-- never be attached to two different creators, even if the URL is typed
-- with different casing, protocol, or a trailing slash.
create unique index creator_social_accounts_normalized_unique_idx
  on public.creator_social_accounts (platform, normalized_profile_url);

create trigger creator_social_accounts_set_updated_at
  before update on public.creator_social_accounts
  for each row execute function public.set_updated_at();

-- A creator can submit/edit their own handle and follower count, but cannot
-- mark their own social account as VERIFIED.
create or replace function public.enforce_social_account_integrity()
returns trigger language plpgsql as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;
  new.verification_status := coalesce(old.verification_status, 'PENDING');
  return new;
end;
$$;

create trigger creator_social_accounts_enforce_integrity
  before insert or update on public.creator_social_accounts
  for each row execute function public.enforce_social_account_integrity();

-- Defense-in-depth (DB-level, not just the frontend form): a creator
-- registration is only complete once BOTH an instagram and a tiktok row
-- exist. This is checked at transaction commit (INITIALLY DEFERRED) so a
-- single registration transaction can insert both rows together.
create or replace function public.check_required_creator_socials()
returns trigger language plpgsql as $$
declare
  v_creator_id uuid;
  v_has_instagram boolean;
  v_has_tiktok boolean;
begin
  if tg_op = 'DELETE' then
    v_creator_id := old.creator_id;
  else
    v_creator_id := new.creator_id;
  end if;

  select exists (select 1 from public.creator_social_accounts where creator_id = v_creator_id and platform = 'instagram'),
         exists (select 1 from public.creator_social_accounts where creator_id = v_creator_id and platform = 'tiktok')
    into v_has_instagram, v_has_tiktok;

  if exists (select 1 from public.creator_profiles where user_id = v_creator_id)
     and not (v_has_instagram and v_has_tiktok) then
    raise exception 'Creator registration requires both an Instagram and a TikTok profile link.';
  end if;

  return null;
end;
$$;

create constraint trigger creator_social_accounts_require_both
  after insert or update or delete on public.creator_social_accounts
  deferrable initially deferred
  for each row execute function public.check_required_creator_socials();

comment on function public.check_required_creator_socials() is
  'Deferred check: only enforced once a creator_profiles row exists for this creator, so it does not block inserting social rows before the creator_profiles row in the same registration transaction — order the inserts as creator_profiles, then social accounts.';

-- Symmetric check on the other side: if creator_social_accounts rows were
-- inserted BEFORE creator_profiles in the same transaction, the trigger
-- above would have skipped enforcement (no creator_profiles row existed
-- yet to check against). This trigger closes that gap by re-running the
-- same check whenever a creator_profiles row is created or updated.
create or replace function public.check_creator_profile_requires_socials()
returns trigger language plpgsql as $$
declare
  v_has_instagram boolean;
  v_has_tiktok boolean;
begin
  select exists (select 1 from public.creator_social_accounts where creator_id = new.user_id and platform = 'instagram'),
         exists (select 1 from public.creator_social_accounts where creator_id = new.user_id and platform = 'tiktok')
    into v_has_instagram, v_has_tiktok;

  if not (v_has_instagram and v_has_tiktok) then
    raise exception 'Creator registration requires both an Instagram and a TikTok profile link.';
  end if;

  return null;
end;
$$;

create constraint trigger creator_profiles_require_socials
  after insert or update on public.creator_profiles
  deferrable initially deferred
  for each row execute function public.check_creator_profile_requires_socials();
