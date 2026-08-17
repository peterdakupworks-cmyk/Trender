-- =====================================================================
-- TRENDER — PHASE 3A: STORAGE FOUNDATION
-- =====================================================================
-- Buckets:
--   avatars         — creator profile pictures. Public read, owner-only write.
--   campaign-media  — advertiser promotional images/video. Public read,
--                      owner-only write. 24s video duration is validated
--                      client-side at upload time (see Create Campaign page);
--                      campaign_media.duration_seconds has a DB check too.
--
-- Convention: every file lives under a folder named for the owning user's
-- auth uid, e.g. avatars/<uid>/avatar.jpg — this is what the RLS policies
-- below check against, via storage.foldername(name).
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('campaign-media', 'campaign-media', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'])
on conflict (id) do nothing;

-- Public read for both buckets (profile pictures and campaign media are
-- meant to be viewable by anyone using the app, including logged-out preview
-- contexts). Write access is restricted to the owning folder below.

create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars: owner write" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: owner update" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: owner delete" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "campaign_media: public read" on storage.objects
  for select using (bucket_id = 'campaign-media');

create policy "campaign_media: owner write" on storage.objects
  for insert with check (bucket_id = 'campaign-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "campaign_media: owner update" on storage.objects
  for update using (bucket_id = 'campaign-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "campaign_media: owner delete" on storage.objects
  for delete using (bucket_id = 'campaign-media' and (storage.foldername(name))[1] = auth.uid()::text);
