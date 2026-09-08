-- Wires the reputation ledger up to real actions. Until now reputation_events
-- was never inserted anywhere, so every member's score rendered as zero
-- forever. These triggers make reputation something earned automatically by
-- building, helping and completing things — never by likes or engagement —
-- matching the event types already defined on reputation_events itself.
--
-- All functions are security definer because reputation_events only allows
-- admin-initiated inserts via RLS (reputation_events_insert_admin); these
-- triggers are the controlled, server-verified path around that, the same
-- pattern already used by handle_new_user() and handle_new_project().

-- ---------------------------------------------------------------------------
-- CONTRIBUTION_ACCEPTED — a project team accepts a member's contribution.
-- ---------------------------------------------------------------------------
create or replace function public.award_reputation_for_contribution()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'ACCEPTED' and old.status is distinct from 'ACCEPTED' then
    if not exists (
      select 1 from public.reputation_events
      where source_table = 'contributions' and source_id = new.id and event_type = 'CONTRIBUTION_ACCEPTED'
    ) then
      insert into public.reputation_events (profile_id, event_type, source_table, source_id, points)
      values (new.profile_id, 'CONTRIBUTION_ACCEPTED', 'contributions', new.id, 10);
    end if;
  end if;
  return new;
end;
$$;

create trigger on_contribution_accepted
  after update on public.contributions
  for each row execute function public.award_reputation_for_contribution();

-- ---------------------------------------------------------------------------
-- PROJECT_JOINED — becoming an active member of a project (including the
-- creator, via handle_new_project()'s own insert into project_members).
-- ---------------------------------------------------------------------------
create or replace function public.award_reputation_for_project_joined()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'ACTIVE' then
    insert into public.reputation_events (profile_id, event_type, source_table, source_id, points)
    values (new.profile_id, 'PROJECT_JOINED', 'project_members', new.id, 5);
  end if;
  return new;
end;
$$;

create trigger on_project_member_joined
  after insert on public.project_members
  for each row execute function public.award_reputation_for_project_joined();

-- ---------------------------------------------------------------------------
-- PROJECT_COMPLETED — every active team member shares credit when a project
-- ships, not just the owner.
-- ---------------------------------------------------------------------------
create or replace function public.award_reputation_for_project_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member record;
begin
  if new.status = 'COMPLETED' and old.status is distinct from 'COMPLETED' then
    for member in
      select profile_id from public.project_members
      where project_id = new.id and status = 'ACTIVE'
    loop
      if not exists (
        select 1 from public.reputation_events
        where source_table = 'projects' and source_id = new.id
          and event_type = 'PROJECT_COMPLETED' and profile_id = member.profile_id
      ) then
        insert into public.reputation_events (profile_id, event_type, source_table, source_id, points)
        values (member.profile_id, 'PROJECT_COMPLETED', 'projects', new.id, 25);
      end if;
    end loop;
  end if;
  return new;
end;
$$;

create trigger on_project_completed
  after update on public.projects
  for each row execute function public.award_reputation_for_project_completed();

-- ---------------------------------------------------------------------------
-- SKILL_VERIFIED — fires only when is_verified genuinely flips to true.
-- profile_skills_guard_verification (see rls_policies.sql) already reverts
-- any non-admin attempt to set is_verified before this AFTER trigger runs,
-- so a forged verification can never award points.
-- ---------------------------------------------------------------------------
create or replace function public.award_reputation_for_skill_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_verified = true and old.is_verified is distinct from true then
    if not exists (
      select 1 from public.reputation_events
      where source_table = 'profile_skills' and source_id = new.id and event_type = 'SKILL_VERIFIED'
    ) then
      insert into public.reputation_events (profile_id, event_type, source_table, source_id, points)
      values (new.profile_id, 'SKILL_VERIFIED', 'profile_skills', new.id, 15);
    end if;
  end if;
  return new;
end;
$$;

create trigger on_skill_verified
  after update on public.profile_skills
  for each row execute function public.award_reputation_for_skill_verified();

-- ---------------------------------------------------------------------------
-- VOTE_CAST / PROPOSAL_CREATED — light-touch governance participation.
-- No duplicate-guard needed: votes has unique(proposal_id, profile_id), and
-- a proposal row is only ever inserted once.
-- ---------------------------------------------------------------------------
create or replace function public.award_reputation_for_vote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.reputation_events (profile_id, event_type, source_table, source_id, points)
  values (new.profile_id, 'VOTE_CAST', 'votes', new.id, 2);
  return new;
end;
$$;

create trigger on_vote_cast
  after insert on public.votes
  for each row execute function public.award_reputation_for_vote();

create or replace function public.award_reputation_for_proposal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.reputation_events (profile_id, event_type, source_table, source_id, points)
  values (new.created_by, 'PROPOSAL_CREATED', 'proposals', new.id, 5);
  return new;
end;
$$;

create trigger on_proposal_created
  after insert on public.proposals
  for each row execute function public.award_reputation_for_proposal();

-- ---------------------------------------------------------------------------
-- CONNECTION_MADE — both members share credit once a connection is accepted.
-- Dormant until the connections feature has UI/actions in front of it, but
-- costs nothing to have wired up now.
-- ---------------------------------------------------------------------------
create or replace function public.award_reputation_for_connection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'ACCEPTED' and old.status is distinct from 'ACCEPTED' then
    if not exists (
      select 1 from public.reputation_events
      where source_table = 'connections' and source_id = new.id and event_type = 'CONNECTION_MADE'
    ) then
      insert into public.reputation_events (profile_id, event_type, source_table, source_id, points)
      values
        (new.requester_id, 'CONNECTION_MADE', 'connections', new.id, 3),
        (new.addressee_id, 'CONNECTION_MADE', 'connections', new.id, 3);
    end if;
  end if;
  return new;
end;
$$;

create trigger on_connection_accepted
  after update on public.connections
  for each row execute function public.award_reputation_for_connection();

-- ---------------------------------------------------------------------------
-- EVENT_ORGANIZED — an organizer's event runs to completion.
-- ---------------------------------------------------------------------------
create or replace function public.award_reputation_for_event_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'COMPLETED' and old.status is distinct from 'COMPLETED' then
    if not exists (
      select 1 from public.reputation_events
      where source_table = 'events' and source_id = new.id and event_type = 'EVENT_ORGANIZED'
    ) then
      insert into public.reputation_events (profile_id, event_type, source_table, source_id, points)
      values (new.organizer_id, 'EVENT_ORGANIZED', 'events', new.id, 15);
    end if;
  end if;
  return new;
end;
$$;

create trigger on_event_completed
  after update on public.events
  for each row execute function public.award_reputation_for_event_completed();
