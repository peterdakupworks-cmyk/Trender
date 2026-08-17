-- ================================================================
-- TRENDER: add advertiser capability flags while preserving legacy type
-- ================================================================
-- Purpose:
--   - keep a single advertiser_profiles row per user
--   - add explicit artist/business capability flags
--   - preserve advertiser_type as a legacy compatibility field for older code
--   - backfill existing rows from the old enum values without duplicating rows
--
-- This migration is idempotent where practical and does not change the
-- existing creator profile, campaign, wallet, or payout flows.

alter table public.advertiser_profiles
  add column if not exists is_artist boolean default false;

alter table public.advertiser_profiles
  add column if not exists is_business boolean default false;

-- Backfill legacy rows from the prior single-value advertiser_type model.
-- music -> is_artist = true, is_business = false
-- business -> is_artist = false, is_business = true
update public.advertiser_profiles
set
  is_artist = (advertiser_type = 'music'),
  is_business = (advertiser_type = 'business')
where
  is_artist is null
  or is_business is null
  or is_artist is distinct from (advertiser_type = 'music')
  or is_business is distinct from (advertiser_type = 'business');

-- Enforce non-null capability fields.
alter table public.advertiser_profiles
  alter column is_artist set default false;

alter table public.advertiser_profiles
  alter column is_business set default false;

alter table public.advertiser_profiles
  alter column is_artist set not null;

alter table public.advertiser_profiles
  alter column is_business set not null;

-- Require every stored advertiser profile to have at least one capability.
-- This keeps the single-row-per-user design consistent with the new model.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'advertiser_profiles_has_capability_check'
      and conrelid = 'public.advertiser_profiles'::regclass
  ) then
    alter table public.advertiser_profiles
      add constraint advertiser_profiles_has_capability_check
      check (is_artist or is_business);
  end if;
end
$$;

comment on column public.advertiser_profiles.is_artist is
  'Whether this advertiser profile has Artist capability. Legacy advertiser_type is kept only for compatibility and is not the source of truth.';

comment on column public.advertiser_profiles.is_business is
  'Whether this advertiser profile has Business capability. Legacy advertiser_type is kept only for compatibility and is not the source of truth.';
