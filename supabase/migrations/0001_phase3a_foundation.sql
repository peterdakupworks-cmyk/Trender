-- =====================================================================
-- TRENDER — PHASE 3A: SUPABASE FOUNDATION
-- =====================================================================
-- Scope: auth, profiles, creator/advertiser profiles, campaign structure,
-- wallet/payout FOUNDATION tables, storage, and Row Level Security.
--
-- Explicitly OUT of scope for this migration (see product spec for phase plan):
--   - Campaign claiming automation / 48h expiry cron
--   - Paystack / real payment processing
--   - Payout processing
--   - AI verification
--   - Automatic social-media analytics
--
-- Run this against a fresh Supabase project's SQL editor, or via the
-- Supabase CLI: `supabase db push` (see supabase/README.md for exact steps).
-- =====================================================================

create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. ENUMS
-- =====================================================================

create type public.user_role as enum ('creator', 'advertiser', 'admin');
create type public.advertiser_type as enum ('music', 'business');
create type public.creator_tier as enum ('starter', 'midtier', 'pro');
create type public.campaign_type as enum ('music', 'business');
create type public.target_type as enum ('city', 'nigeria');
create type public.campaign_status as enum ('LIVE', 'IN PROGRESS', 'SUBMISSION/REVIEW', 'COMPLETED', 'CLOSED');
create type public.task_status as enum ('AVAILABLE', 'CLAIMED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'EXPIRED');
create type public.submission_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type public.wallet_transaction_type as enum ('CAMPAIGN_EARNING', 'PAYOUT', 'PAYOUT_FEE', 'ADJUSTMENT');
create type public.payout_status as enum ('PENDING', 'PROCESSING', 'PAID', 'FAILED');
create type public.social_platform as enum ('instagram', 'tiktok', 'facebook', 'youtube', 'x');

-- Business constants, kept here as a single source of truth for defaults/checks.
-- Actual admin-configurable rates belong in a future settings table (Phase 3B+).
-- 1 Naira = 100 kobo. All money columns are bigint kobo to avoid float rounding.
--   Starter  = ₦500   = 50000 kobo
--   Mid-tier = ₦1,000 = 100000 kobo
--   Pro      = ₦1,500 = 150000 kobo
--   Platform fee / Creator payout fee = 7.5%
--   Minimum payout = ₦5,000 = 500000 kobo

-- =====================================================================
-- 2. SHARED TRIGGER HELPERS
-- =====================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- True if the current request is running as the Supabase service role
-- (i.e. a trusted server-side call, never the browser).
create or replace function public.is_service_role()
returns boolean language sql stable as $$
  select auth.role() = 'service_role';
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- =====================================================================
-- 3. PROFILES
-- =====================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'creator',
  full_name text,
  username text unique,
  email text,
  profile_image_url text,
  bio text,
  country text not null default 'Nigeria',
  state text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Block client-side role escalation: a normal authenticated session can
-- never set role = 'admin', and can never change its own role at all once
-- set, except through a trusted service-role call (future admin tooling).
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
    raise exception 'Users cannot change their own role.';
  end if;

  return new;
end;
$$;

create trigger profiles_enforce_role_integrity
  before insert or update on public.profiles
  for each row execute function public.enforce_role_integrity();

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles: insert own" on public.profiles
  for insert with check (id = auth.uid());

create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- =====================================================================
-- 4. CREATOR PROFILE
-- =====================================================================

create table public.creator_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  follower_count integer not null default 0,
  tier public.creator_tier not null default 'starter',
  account_status text not null default 'active',
  trender_score integer not null default 0,
  identity_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger creator_profiles_set_updated_at
  before update on public.creator_profiles
  for each row execute function public.set_updated_at();

-- Creators shouldn't be able to self-assign their own tier (that's a
-- follower-count-driven admin/verification decision later).
create or replace function public.enforce_creator_tier_integrity()
returns trigger language plpgsql as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.tier <> old.tier then
    raise exception 'Creator tier can only be changed by an administrator.';
  end if;
  return new;
end;
$$;

create trigger creator_profiles_enforce_tier
  before insert or update on public.creator_profiles
  for each row execute function public.enforce_creator_tier_integrity();

alter table public.creator_profiles enable row level security;

create policy "creator_profiles: read own" on public.creator_profiles
  for select using (user_id = auth.uid() or public.is_admin());

create policy "creator_profiles: insert own" on public.creator_profiles
  for insert with check (user_id = auth.uid());

create policy "creator_profiles: update own" on public.creator_profiles
  for update using (user_id = auth.uid() or public.is_admin());

create table public.creator_social_accounts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  platform public.social_platform not null,
  handle text not null,
  created_at timestamptz not null default now(),
  unique (creator_id, platform)
);

alter table public.creator_social_accounts enable row level security;

create policy "creator_social_accounts: read own" on public.creator_social_accounts
  for select using (creator_id = auth.uid() or public.is_admin());

create policy "creator_social_accounts: manage own" on public.creator_social_accounts
  for insert with check (creator_id = auth.uid());

create policy "creator_social_accounts: update own" on public.creator_social_accounts
  for update using (creator_id = auth.uid());

create policy "creator_social_accounts: delete own" on public.creator_social_accounts
  for delete using (creator_id = auth.uid());

-- =====================================================================
-- 5. ADVERTISER PROFILE (Artist or Business/Brand)
-- =====================================================================

create table public.advertiser_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  advertiser_type public.advertiser_type not null,
  brand_name text not null,
  logo_url text,
  description text,
  category text,
  website_url text,
  contact_info text,
  spotify_url text, -- music advertisers only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger advertiser_profiles_set_updated_at
  before update on public.advertiser_profiles
  for each row execute function public.set_updated_at();

alter table public.advertiser_profiles enable row level security;

create policy "advertiser_profiles: read own" on public.advertiser_profiles
  for select using (user_id = auth.uid() or public.is_admin());

create policy "advertiser_profiles: insert own" on public.advertiser_profiles
  for insert with check (user_id = auth.uid());

create policy "advertiser_profiles: update own" on public.advertiser_profiles
  for update using (user_id = auth.uid() or public.is_admin());

-- =====================================================================
-- 6. CAMPAIGNS
-- =====================================================================

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.profiles(id),
  campaign_type public.campaign_type not null,
  title text not null,
  description text,
  spotify_url text, -- music campaigns
  offer text, -- business campaigns
  budget_kobo bigint not null default 0 check (budget_kobo >= 0),
  creator_allocation_kobo bigint not null default 0 check (creator_allocation_kobo >= 0),
  platform_fee_kobo bigint not null default 0 check (platform_fee_kobo >= 0),
  total_amount_kobo bigint not null default 0 check (total_amount_kobo >= 0),
  target_type public.target_type not null default 'nigeria',
  target_country text not null default 'Nigeria',
  target_state text,
  target_city text,
  status public.campaign_status not null default 'LIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  start_at timestamptz,
  end_at timestamptz,
  constraint city_targeting_requires_state_city check (
    target_type = 'nigeria' or (target_state is not null and target_city is not null)
  )
);

create index campaigns_advertiser_idx on public.campaigns(advertiser_id);
create index campaigns_status_idx on public.campaigns(status);
create index campaigns_target_idx on public.campaigns(target_type, target_state, target_city);

create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

-- Recompute platform_fee_kobo/total_amount_kobo server-side from
-- creator_allocation_kobo so the client can never post a fake fee/total.
create or replace function public.enforce_campaign_pricing()
returns trigger language plpgsql as $$
begin
  new.platform_fee_kobo := round(new.creator_allocation_kobo * 0.075);
  new.total_amount_kobo := new.creator_allocation_kobo + new.platform_fee_kobo;
  return new;
end;
$$;

create trigger campaigns_enforce_pricing
  before insert or update on public.campaigns
  for each row execute function public.enforce_campaign_pricing();

alter table public.campaigns enable row level security;

-- Any authenticated user can browse campaigns (creators need to discover
-- them). Only the owning advertiser (or admin) can see/change budget internals
-- via the same row — a narrower "public campaign card" view can be added later
-- if advertiser financial detail needs to be hidden from creators.
create policy "campaigns: read all authenticated" on public.campaigns
  for select using (auth.role() = 'authenticated' or public.is_admin());

create policy "campaigns: advertiser insert own" on public.campaigns
  for insert with check (advertiser_id = auth.uid());

create policy "campaigns: advertiser update own" on public.campaigns
  for update using (advertiser_id = auth.uid() or public.is_admin());

create table public.campaign_creator_requirements (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  tier public.creator_tier not null,
  quantity integer not null check (quantity > 0),
  rate_kobo bigint not null check (rate_kobo > 0),
  unique (campaign_id, tier)
);

alter table public.campaign_creator_requirements enable row level security;

create policy "requirements: read all authenticated" on public.campaign_creator_requirements
  for select using (auth.role() = 'authenticated' or public.is_admin());

create policy "requirements: advertiser manage own" on public.campaign_creator_requirements
  for insert with check (
    exists (select 1 from public.campaigns c where c.id = campaign_id and c.advertiser_id = auth.uid())
  );

create policy "requirements: advertiser update own" on public.campaign_creator_requirements
  for update using (
    exists (select 1 from public.campaigns c where c.id = campaign_id and c.advertiser_id = auth.uid())
  );

create policy "requirements: advertiser delete own" on public.campaign_creator_requirements
  for delete using (
    exists (select 1 from public.campaigns c where c.id = campaign_id and c.advertiser_id = auth.uid())
  );

create table public.campaign_media (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  storage_path text not null,
  duration_seconds integer,
  created_at timestamptz not null default now(),
  constraint video_max_24s check (media_type <> 'video' or duration_seconds is null or duration_seconds <= 24)
);

alter table public.campaign_media enable row level security;

create policy "campaign_media: read all authenticated" on public.campaign_media
  for select using (auth.role() = 'authenticated' or public.is_admin());

create policy "campaign_media: advertiser manage own" on public.campaign_media
  for insert with check (
    exists (select 1 from public.campaigns c where c.id = campaign_id and c.advertiser_id = auth.uid())
  );

create policy "campaign_media: advertiser delete own" on public.campaign_media
  for delete using (
    exists (select 1 from public.campaigns c where c.id = campaign_id and c.advertiser_id = auth.uid())
  );

-- =====================================================================
-- 7. CAMPAIGN TASKS (foundation only — claim automation is Phase 3B)
-- =====================================================================

create table public.campaign_tasks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_id uuid not null references public.profiles(id),
  tier public.creator_tier not null,
  status public.task_status not null default 'CLAIMED',
  claimed_at timestamptz not null default now(),
  deadline_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, creator_id)
);

create index campaign_tasks_creator_idx on public.campaign_tasks(creator_id);
create index campaign_tasks_campaign_idx on public.campaign_tasks(campaign_id);

create trigger campaign_tasks_set_updated_at
  before update on public.campaign_tasks
  for each row execute function public.set_updated_at();

-- Creators can move their own task between CLAIMED / SUBMITTED / EXPIRED.
-- Only a trusted server process (admin review, Phase 3B) can set APPROVED/REJECTED.
create or replace function public.enforce_task_status_integrity()
returns trigger language plpgsql as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;
  if new.status in ('APPROVED', 'REJECTED') then
    raise exception 'Only an administrator can approve or reject a task.';
  end if;
  return new;
end;
$$;

create trigger campaign_tasks_enforce_status
  before insert or update on public.campaign_tasks
  for each row execute function public.enforce_task_status_integrity();

alter table public.campaign_tasks enable row level security;

create policy "campaign_tasks: creator reads own" on public.campaign_tasks
  for select using (
    creator_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.campaigns c where c.id = campaign_id and c.advertiser_id = auth.uid())
  );

create policy "campaign_tasks: creator claims" on public.campaign_tasks
  for insert with check (creator_id = auth.uid());

create policy "campaign_tasks: creator updates own" on public.campaign_tasks
  for update using (creator_id = auth.uid() or public.is_admin());

-- =====================================================================
-- 8. CAMPAIGN SUBMISSIONS (foundation only — review workflow is Phase 3B)
-- =====================================================================

create table public.campaign_submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_task_id uuid not null references public.campaign_tasks(id) on delete cascade,
  creator_id uuid not null references public.profiles(id),
  campaign_id uuid not null references public.campaigns(id),
  content_url text not null,
  platform text,
  submitted_at timestamptz not null default now(),
  status public.submission_status not null default 'PENDING',
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  review_notes text
);

create index campaign_submissions_creator_idx on public.campaign_submissions(creator_id);
create index campaign_submissions_campaign_idx on public.campaign_submissions(campaign_id);

-- Only a trusted server process can move a submission out of PENDING.
create or replace function public.enforce_submission_review_integrity()
returns trigger language plpgsql as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;
  if new.status <> 'PENDING' then
    raise exception 'Only an administrator can review a submission.';
  end if;
  if new.reviewed_by is not null or new.reviewed_at is not null then
    raise exception 'Review fields can only be set by an administrator.';
  end if;
  return new;
end;
$$;

create trigger campaign_submissions_enforce_review
  before insert or update on public.campaign_submissions
  for each row execute function public.enforce_submission_review_integrity();

alter table public.campaign_submissions enable row level security;

create policy "submissions: creator reads own" on public.campaign_submissions
  for select using (
    creator_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.campaigns c where c.id = campaign_id and c.advertiser_id = auth.uid())
  );

create policy "submissions: creator inserts own" on public.campaign_submissions
  for insert with check (creator_id = auth.uid());

create policy "submissions: creator updates own pending" on public.campaign_submissions
  for update using (creator_id = auth.uid() or public.is_admin());

-- =====================================================================
-- 9. WALLET (foundation only — no client-side balance writes, ever)
-- =====================================================================

create table public.wallets (
  creator_id uuid primary key references public.profiles(id) on delete cascade,
  available_balance_kobo bigint not null default 0 check (available_balance_kobo >= 0),
  pending_balance_kobo bigint not null default 0 check (pending_balance_kobo >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger wallets_set_updated_at
  before update on public.wallets
  for each row execute function public.set_updated_at();

alter table public.wallets enable row level security;

create policy "wallets: creator reads own" on public.wallets
  for select using (creator_id = auth.uid() or public.is_admin());

-- No insert/update/delete policy for authenticated users at all — a wallet
-- row is created by a trusted server process (service role) when a creator
-- profile is created, and balances only ever change through server-side
-- logic in a later phase. This is intentional: the absence of a policy
-- means RLS denies the action by default.

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(creator_id),
  creator_id uuid not null references public.profiles(id),
  amount_kobo bigint not null,
  transaction_type public.wallet_transaction_type not null,
  reference_id uuid,
  description text,
  created_at timestamptz not null default now()
);

create index wallet_transactions_creator_idx on public.wallet_transactions(creator_id);

alter table public.wallet_transactions enable row level security;

create policy "wallet_transactions: creator reads own" on public.wallet_transactions
  for select using (creator_id = auth.uid() or public.is_admin());

-- No client insert/update/delete policy — ledger is server-written only.

-- =====================================================================
-- 10. PAYOUTS (foundation only — no real money movement here)
-- =====================================================================

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id),
  wallet_id uuid not null references public.wallets(creator_id),
  gross_amount_kobo bigint not null check (gross_amount_kobo >= 500000), -- ₦5,000 minimum
  payout_fee_kobo bigint not null default 0,
  net_amount_kobo bigint not null default 0,
  status public.payout_status not null default 'PENDING',
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payouts_creator_idx on public.payouts(creator_id);

create trigger payouts_set_updated_at
  before update on public.payouts
  for each row execute function public.set_updated_at();

-- Always recompute fee/net server-side from gross using the fixed 7.5% rate —
-- a client can never post its own fee/net numbers. Status changes (moving a
-- payout to PROCESSING/PAID/FAILED) are reserved for a trusted server process.
create or replace function public.enforce_payout_integrity()
returns trigger language plpgsql as $$
begin
  new.payout_fee_kobo := round(new.gross_amount_kobo * 0.075);
  new.net_amount_kobo := new.gross_amount_kobo - new.payout_fee_kobo;

  if not (public.is_service_role() or public.is_admin()) then
    if tg_op = 'INSERT' and new.status <> 'PENDING' then
      raise exception 'New payout requests must start as PENDING.';
    end if;
    if tg_op = 'UPDATE' and new.status <> old.status then
      raise exception 'Only an administrator can change payout status.';
    end if;
  end if;

  return new;
end;
$$;

create trigger payouts_enforce_integrity
  before insert or update on public.payouts
  for each row execute function public.enforce_payout_integrity();

alter table public.payouts enable row level security;

create policy "payouts: creator reads own" on public.payouts
  for select using (creator_id = auth.uid() or public.is_admin());

create policy "payouts: creator requests own" on public.payouts
  for insert with check (creator_id = auth.uid());

-- No client update policy — even though the trigger above blocks illegal
-- status changes, we also don't grant an UPDATE policy at all for normal
-- users, so payout rows are effectively append-only from the client side.

-- =====================================================================
-- 11. NEW-USER BOOTSTRAP
-- =====================================================================
-- When a new auth.users row is created, automatically create a matching
-- profiles row (role defaults to 'creator'; the app updates it right after
-- signup based on which registration form was used). This runs as the
-- table owner (security definer), not the calling user, so it can insert
-- into public.profiles before any RLS policy would otherwise apply.

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- =====================================================================
-- 12. LOCATION ELIGIBILITY HELPER (kept from the earlier draft schema)
-- =====================================================================

create or replace function public.get_eligible_campaigns(p_creator_id uuid)
returns setof public.campaigns
language sql stable as $$
  select c.*
  from public.campaigns c
  join public.creator_profiles cp on cp.user_id = p_creator_id
  join public.profiles p on p.id = p_creator_id
  where c.status = 'LIVE'
    and (
      c.target_type = 'nigeria'
      or (
        c.target_type = 'city'
        and lower(trim(p.city)) = lower(trim(c.target_city))
        and lower(trim(p.state)) = lower(trim(c.target_state))
      )
    );
$$;

-- =====================================================================
-- NOTES FOR PHASE 3B+
-- =====================================================================
-- - Claim automation (creating campaign_tasks rows, 48h deadline_at,
--   lazy/cron expiry) is not implemented here.
-- - Submission review workflow (admin approving/rejecting, wallet crediting)
--   is not implemented here.
-- - Payout processing (Paystack transfer, status transitions) is not
--   implemented here.
-- - Admin dashboard queries can rely on public.is_admin() and the read
--   policies above; no admin UI is built in this phase.
