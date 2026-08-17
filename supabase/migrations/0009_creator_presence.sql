create table if not exists public.creator_presence (
  creator_id uuid primary key references public.profiles(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger creator_presence_set_updated_at
before update on public.creator_presence
for each row execute function public.set_updated_at();

create or replace function public.get_active_creator_count()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int
  from public.creator_presence cp
  join public.creator_profiles cp2 on cp2.user_id = cp.creator_id
  where cp.last_seen_at >= now() - interval '5 minutes'
    and cp2.identity_status = 'approved'
    and cp2.account_status = 'active';
$$;

revoke all on function public.get_active_creator_count() from public;
grant execute on function public.get_active_creator_count() to authenticated;

alter table public.creator_presence enable row level security;

create policy "creator_presence: read own" on public.creator_presence
  for select using (creator_id = auth.uid() or public.is_admin());

create policy "creator_presence: upsert own" on public.creator_presence
  for insert with check (creator_id = auth.uid());

create policy "creator_presence: update own" on public.creator_presence
  for update using (creator_id = auth.uid());

create policy "creator_presence: delete own" on public.creator_presence
  for delete using (creator_id = auth.uid());
