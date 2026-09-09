-- Account lifecycle: self-service deletion, and a data-retention policy so
-- deleting your own account never takes shared data with it.
--
-- Every one of these tables' FKs to profiles is currently "on delete
-- cascade" (or, for a handful of reviewer/audit columns, has no "on
-- delete" clause at all, which defaults to NO ACTION). Both are wrong for
-- a table that shared, multi-user content actually depends on: cascading
-- from e.g. projects.owner_id would delete a project out from under every
-- other member the instant the owner deletes their account, taking their
-- project_members/contributions rows with it. The fix is "on delete set
-- null" for exactly the columns that are the shared container's own link
-- back to its creator/owner — the container row (and everyone else's data
-- attached to it) survives; only the reference to the deleted account is
-- cleared. Purely private, single-owner tables (ai_*, presence,
-- notifications, connections, likes, comments, applications,
-- project_members, votes, subscriptions, profile_skills, achievements,
-- reputation_events.profile_id, verifications.profile_id,
-- contributions.profile_id) are untouched here — cascade is already
-- correct for them, since nothing there is ever visible to another user.

-- ---------------------------------------------------------------------------
-- Shared containers: owner/author link becomes nullable + set null.
-- ---------------------------------------------------------------------------
alter table public.projects alter column owner_id drop not null;
alter table public.projects drop constraint projects_owner_id_fkey;
alter table public.projects add constraint projects_owner_id_fkey
  foreign key (owner_id) references public.profiles (id) on delete set null;

alter table public.organizations alter column created_by drop not null;
alter table public.organizations drop constraint organizations_created_by_fkey;
alter table public.organizations add constraint organizations_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.opportunities alter column posted_by drop not null;
alter table public.opportunities drop constraint opportunities_posted_by_fkey;
alter table public.opportunities add constraint opportunities_posted_by_fkey
  foreign key (posted_by) references public.profiles (id) on delete set null;

alter table public.events alter column organizer_id drop not null;
alter table public.events drop constraint events_organizer_id_fkey;
alter table public.events add constraint events_organizer_id_fkey
  foreign key (organizer_id) references public.profiles (id) on delete set null;

alter table public.posts alter column author_id drop not null;
alter table public.posts drop constraint posts_author_id_fkey;
alter table public.posts add constraint posts_author_id_fkey
  foreign key (author_id) references public.profiles (id) on delete set null;

alter table public.proposals alter column created_by drop not null;
alter table public.proposals drop constraint proposals_created_by_fkey;
alter table public.proposals add constraint proposals_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.charter_proposals alter column proposed_by drop not null;
alter table public.charter_proposals drop constraint charter_proposals_proposed_by_fkey;
alter table public.charter_proposals add constraint charter_proposals_proposed_by_fkey
  foreign key (proposed_by) references public.profiles (id) on delete set null;

alter table public.city_updates alter column posted_by drop not null;
alter table public.city_updates drop constraint city_updates_posted_by_fkey;
alter table public.city_updates add constraint city_updates_posted_by_fkey
  foreign key (posted_by) references public.profiles (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Reviewer/audit columns: already nullable, but had no "on delete" clause
-- at all (implicit NO ACTION) — that would block a reviewer/admin from
-- ever deleting their own account. Made explicit "set null" so the
-- reviewed record survives untouched.
-- ---------------------------------------------------------------------------
alter table public.verifications drop constraint verifications_reviewed_by_fkey;
alter table public.verifications add constraint verifications_reviewed_by_fkey
  foreign key (reviewed_by) references public.profiles (id) on delete set null;

alter table public.contributions drop constraint contributions_reviewed_by_fkey;
alter table public.contributions add constraint contributions_reviewed_by_fkey
  foreign key (reviewed_by) references public.profiles (id) on delete set null;

alter table public.reports drop constraint reports_reviewed_by_fkey;
alter table public.reports add constraint reports_reviewed_by_fkey
  foreign key (reviewed_by) references public.profiles (id) on delete set null;

alter table public.reputation_events drop constraint reputation_events_created_by_fkey;
alter table public.reputation_events add constraint reputation_events_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.charter_versions drop constraint charter_versions_created_by_fkey;
alter table public.charter_versions add constraint charter_versions_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Self-service account deletion, with no service-role key anywhere.
--
-- Supersedes the "account deletion is an admin-mediated / future
-- edge-function action" comment in 20260907120007_rls_policies.sql — this
-- is that future action. security definer lets this reach auth.users,
-- exactly like handle_new_user() already reaches it in the other
-- direction; it is safe by construction because it takes no parameter and
-- can only ever delete auth.uid()'s own row. profiles and every table
-- above cascade/null out automatically from the auth.users delete via
-- their existing FKs — no application code touches those rows directly.
-- ---------------------------------------------------------------------------
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_own_account() to authenticated;
