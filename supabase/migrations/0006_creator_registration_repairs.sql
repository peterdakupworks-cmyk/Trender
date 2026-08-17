-- =====================================================================
-- TRENDER — PHASE 3A: CREATOR REGISTRATION REPAIRS
-- =====================================================================
-- Targets the live 0001 + 0004 schema only. It deliberately does not use
-- 0002_creator_registration_foundation.sql, which is documented as unapplied
-- and contains unrelated schema changes.
--
-- Repairs two prerequisites used by the existing creator registration UI:
--   1. profiles.phone, referenced by complete_creator_registration in 0004
--   2. the public avatars Storage bucket and its owner-only write policies
--
-- Both operations are idempotent so this is safe if a bucket/column was
-- provisioned manually or partially during earlier setup.
-- =====================================================================

-- Phone is intentionally added because it is an established part of the
-- creator registration UI, the RPC signature, TypeScript model, and the
-- earlier planned 0002 schema. 0001 omitted it even though 0004 writes it.
-- No unrelated 0002 verification/risk changes are included here.
alter table public.profiles
  add column if not exists phone text;

-- The registration and profile pages upload to storage.from('avatars').
-- 0003 was meant to create this bucket; the reported NoSuchBucket response
-- proves it is absent in the connected project. on conflict prevents a
-- duplicate bucket if it has since been created manually.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Reassert the same avatar object policies defined in 0003. Dropping by name
-- first makes this migration safe whether 0003's policies are absent or were
-- manually created; it does not create duplicate policies.
drop policy if exists "avatars: public read" on storage.objects;
drop policy if exists "avatars: owner write" on storage.objects;
drop policy if exists "avatars: owner update" on storage.objects;
drop policy if exists "avatars: owner delete" on storage.objects;

create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars: owner write" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: owner update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: owner delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
