-- =====================================================================
-- TRENDER — MINIMAL REPAIR: add the missing profiles.phone column
-- =====================================================================
-- Root cause of "column \"phone\" does not exist" from complete_creator_registration:
--
-- supabase/migrations/0001_phase3a_foundation.sql (confirmed live) does NOT
-- include a `phone` column on public.profiles. `phone` was only ever added
-- in 0002_creator_registration_foundation.sql, which is NOT confirmed live
-- (see the note at the top of 0004_atomic_creator_registration.sql — this
-- is the same "0002 wasn't actually applied" situation already found once).
--
-- 0004's complete_creator_registration() function references
-- `profiles.phone` (the registration form has always collected a phone
-- number). CREATE FUNCTION doesn't validate column references inside a
-- plpgsql body at creation time — only when the function actually runs —
-- which is why 0004 could be "successfully applied" as a migration while
-- still failing the first time it's actually called.
--
-- This migration adds ONLY that one missing column. It does not pull in
-- any other part of 0002 (no renamed columns, no new enum types, no
-- duplicate-account triggers) — deliberately minimal, per "do not blindly
-- redesign the registration schema."
--
-- NOT APPLIED AUTOMATICALLY. Review, then run this in the Supabase SQL
-- editor yourself.
-- =====================================================================

alter table public.profiles add column if not exists phone text;

-- Defense-in-depth, matching the same pattern used for email elsewhere:
-- unique only where a phone number is actually present, so existing rows
-- with no phone yet aren't affected.
create unique index if not exists profiles_phone_unique_idx on public.profiles (phone) where phone is not null;
