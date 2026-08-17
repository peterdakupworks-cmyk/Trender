-- TRENDER MVP DATABASE PLAN
-- AI verification is intentionally excluded.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('creator','artist','admin');
create type public.campaign_status as enum ('draft','active','paused','completed','cancelled');
create type public.submission_status as enum ('pending_review','approved','rejected');
create type public.transaction_type as enum ('campaign_funding','creator_earning','withdrawal','refund','fee');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  display_name text,
  avatar_url text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.creator_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  tiktok_username text,
  instagram_username text,
  niche text,
  city text,
  state text,
  spotify_connected boolean not null default false,
  spotify_user_id text,
  tier text,
  trender_score integer not null default 0,
  identity_status text not null default 'pending'
);

create table public.artist_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  brand_name text,
  genre text,
  spotify_url text,
  logo_url text,
  contact_info text
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.profiles(id),
  title text not null,
  spotify_url text not null,
  category text,
  location text,
  creator_tier text,
  requirements text,
  target_scope text not null default 'nigeria' check (target_scope in ('city','nigeria')),
  target_city text,
  target_state text,
  budget_kobo bigint not null default 0,
  reward_kobo bigint not null default 0,
  status public.campaign_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.campaign_tasks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_id uuid not null references public.profiles(id),
  status text not null default 'accepted',
  accepted_at timestamptz not null default now(),
  unique (campaign_id, creator_id)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.campaign_tasks(id) on delete cascade,
  platform text not null,
  post_url text not null,
  note text,
  status public.submission_status not null default 'pending_review',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  available_kobo bigint not null default 0,
  pending_kobo bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  type public.transaction_type not null,
  amount_kobo bigint not null,
  reference text,
  description text,
  created_at timestamptz not null default now()
);

create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id),
  amount_kobo bigint not null,
  bank_name text,
  account_name text,
  account_number text,
  status text not null default 'pending',
  paystack_transfer_reference text,
  created_at timestamptz not null default now()
);

-- IMPORTANT:
-- Add Row Level Security policies before production.
-- Never let clients directly update wallet balances.
-- Wallet changes should happen through trusted server-side functions.


-- LOCATION TARGETING RULE:
-- For target_scope = 'city', target_city and target_state must be populated.
-- For target_scope = 'nigeria', target_city/target_state may be null.
-- In production, campaign eligibility must be enforced server-side using the
-- creator's approved location; do not rely only on client-side filtering.


-- Eligibility helper for campaign discovery.
-- City campaigns are visible only to creators whose approved profile location
-- matches the campaign city/state. Nigeria campaigns are visible nationwide.
create or replace function public.get_eligible_campaigns(p_creator_id uuid)
returns setof public.campaigns
language sql
stable
as $$
  select c.*
  from public.campaigns c
  join public.creator_profiles cp on cp.user_id = p_creator_id
  where c.status = 'active'
    and (
      c.target_scope = 'nigeria'
      or (
        c.target_scope = 'city'
        and lower(trim(cp.city)) = lower(trim(c.target_city))
        and lower(trim(cp.state)) = lower(trim(c.target_state))
      )
    );
$$;

-- In production, expose this function through a controlled RPC and add RLS.
-- Do not trust a client-side city filter for campaign access.
