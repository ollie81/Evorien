-- Live network activity. A member's own last-seen timestamp is private —
-- it lives in its own RLS-locked table so no member can see when anyone
-- else was last active, even though the aggregate count is public. This
-- mirrors how profile_reputation_scores already sums a locked-down table:
-- the view runs with the view owner's privileges and only ever exposes a
-- count, never the underlying rows.

create table public.presence (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

alter table public.presence enable row level security;

create policy "presence_select_own" on public.presence for select to authenticated
  using (profile_id = auth.uid() or public.is_admin());
create policy "presence_insert_own" on public.presence for insert to authenticated
  with check (profile_id = auth.uid());
create policy "presence_update_own" on public.presence for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- "Online" is computed at read time as "heartbeat within the last 2
-- minutes" — there is deliberately no cleanup job. A member who closes
-- their tab just stops heartbeating and ages out of the count on its own.
create or replace view public.live_presence as
select
  (select count(*) from public.presence where last_seen_at > now() - interval '2 minutes') as online_count,
  (select count(*) from public.profiles where onboarding_completed and created_at >= date_trunc('day', now())) as new_members_today;

grant select on public.live_presence to anon, authenticated;
