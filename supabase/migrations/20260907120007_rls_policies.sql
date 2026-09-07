-- Row Level Security for every table. Nothing is readable or writable unless
-- a policy explicitly allows it — RLS defaults to deny.

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- No INSERT policy: rows are created only by the handle_new_user() trigger
-- (security definer), never directly by a client. No DELETE policy for V1;
-- account deletion is an admin-mediated / future edge-function action.

-- ---------------------------------------------------------------------------
-- PILLARS / SKILLS / PROFILE_SKILLS
-- ---------------------------------------------------------------------------
alter table public.pillars enable row level security;

create policy "pillars_select_all" on public.pillars for select to anon, authenticated using (true);
create policy "pillars_insert_admin" on public.pillars for insert to authenticated with check (public.is_admin());
create policy "pillars_update_admin" on public.pillars for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "pillars_delete_admin" on public.pillars for delete to authenticated using (public.is_admin());

alter table public.skills enable row level security;

create policy "skills_select_authenticated" on public.skills for select to authenticated using (true);
create policy "skills_insert_authenticated" on public.skills for insert to authenticated with check (true);
create policy "skills_update_admin" on public.skills for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "skills_delete_admin" on public.skills for delete to authenticated using (public.is_admin());

alter table public.profile_skills enable row level security;

create policy "profile_skills_select_authenticated" on public.profile_skills for select to authenticated using (true);
create policy "profile_skills_insert_own" on public.profile_skills for insert to authenticated with check (profile_id = auth.uid());
create policy "profile_skills_update_own" on public.profile_skills for update to authenticated
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());
create policy "profile_skills_delete_own" on public.profile_skills for delete to authenticated
  using (profile_id = auth.uid() or public.is_admin());

-- A member can never verify their own skill — silently ignore attempts to
-- flip is_verified unless the actor is an admin.
create or replace function public.prevent_self_skill_verification()
returns trigger
language plpgsql
as $$
begin
  if new.is_verified is distinct from old.is_verified and not public.is_admin() then
    new.is_verified := old.is_verified;
  end if;
  return new;
end;
$$;

create trigger profile_skills_guard_verification
  before update on public.profile_skills
  for each row execute function public.prevent_self_skill_verification();

-- ---------------------------------------------------------------------------
-- VERIFICATION / REPUTATION / ACHIEVEMENTS
-- ---------------------------------------------------------------------------
alter table public.verifications enable row level security;

create policy "verifications_select_own_or_admin" on public.verifications for select to authenticated
  using (profile_id = auth.uid() or public.is_admin());
create policy "verifications_insert_own" on public.verifications for insert to authenticated
  with check (profile_id = auth.uid());
create policy "verifications_update_admin" on public.verifications for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

alter table public.reputation_events enable row level security;

create policy "reputation_events_select_own_or_admin" on public.reputation_events for select to authenticated
  using (profile_id = auth.uid() or public.is_admin());
create policy "reputation_events_insert_admin" on public.reputation_events for insert to authenticated
  with check (public.is_admin());
-- No UPDATE or DELETE policy anywhere: the reputation ledger is append-only.

alter table public.achievements enable row level security;

create policy "achievements_select_authenticated" on public.achievements for select to authenticated using (true);
create policy "achievements_insert_admin" on public.achievements for insert to authenticated with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- ORGANIZATIONS
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;

create policy "organizations_select_authenticated" on public.organizations for select to authenticated using (true);
create policy "organizations_insert_authenticated" on public.organizations for insert to authenticated
  with check (created_by = auth.uid());
create policy "organizations_update_team" on public.organizations for update to authenticated
  using (public.is_org_team(id) or public.is_admin())
  with check (public.is_org_team(id) or public.is_admin());
create policy "organizations_delete_team" on public.organizations for delete to authenticated
  using (public.is_org_team(id) or public.is_admin());

alter table public.organization_members enable row level security;

create policy "organization_members_select_authenticated" on public.organization_members for select to authenticated using (true);
create policy "organization_members_insert" on public.organization_members for insert to authenticated
  with check (
    (profile_id = auth.uid() and role = 'MEMBER')
    or public.is_org_team(organization_id)
    or exists (select 1 from public.organizations o where o.id = organization_id and o.created_by = auth.uid())
  );
create policy "organization_members_update_team" on public.organization_members for update to authenticated
  using (public.is_org_team(organization_id) or public.is_admin())
  with check (public.is_org_team(organization_id) or public.is_admin());
create policy "organization_members_delete" on public.organization_members for delete to authenticated
  using (profile_id = auth.uid() or public.is_org_team(organization_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- PROJECTS
-- ---------------------------------------------------------------------------
alter table public.projects enable row level security;

create policy "projects_select_authenticated" on public.projects for select to authenticated using (true);
create policy "projects_insert_authenticated" on public.projects for insert to authenticated
  with check (owner_id = auth.uid());
create policy "projects_update_team" on public.projects for update to authenticated
  using (public.is_project_team(id) or public.is_admin())
  with check (public.is_project_team(id) or public.is_admin());
create policy "projects_delete_owner" on public.projects for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

alter table public.project_members enable row level security;

create policy "project_members_select_authenticated" on public.project_members for select to authenticated using (true);
create policy "project_members_insert" on public.project_members for insert to authenticated
  with check (
    (profile_id = auth.uid() and status in ('PENDING', 'ACTIVE'))
    or public.is_project_team(project_id)
  );
create policy "project_members_update" on public.project_members for update to authenticated
  using (profile_id = auth.uid() or public.is_project_team(project_id) or public.is_admin())
  with check (profile_id = auth.uid() or public.is_project_team(project_id) or public.is_admin());
create policy "project_members_delete" on public.project_members for delete to authenticated
  using (profile_id = auth.uid() or public.is_project_team(project_id) or public.is_admin());

alter table public.project_skills enable row level security;

create policy "project_skills_select_authenticated" on public.project_skills for select to authenticated using (true);
create policy "project_skills_insert_team" on public.project_skills for insert to authenticated
  with check (public.is_project_team(project_id));
create policy "project_skills_update_team" on public.project_skills for update to authenticated
  using (public.is_project_team(project_id)) with check (public.is_project_team(project_id));
create policy "project_skills_delete_team" on public.project_skills for delete to authenticated
  using (public.is_project_team(project_id));

-- ---------------------------------------------------------------------------
-- CONTRIBUTIONS
-- ---------------------------------------------------------------------------
alter table public.contributions enable row level security;

create policy "contributions_select" on public.contributions for select to authenticated
  using (
    profile_id = auth.uid()
    or (project_id is not null and public.is_project_team(project_id))
    or public.is_admin()
  );
create policy "contributions_insert_own" on public.contributions for insert to authenticated
  with check (profile_id = auth.uid());
create policy "contributions_update" on public.contributions for update to authenticated
  using (
    (profile_id = auth.uid() and status = 'PENDING')
    or (project_id is not null and public.is_project_team(project_id))
    or public.is_admin()
  )
  with check (
    (profile_id = auth.uid() and status = 'PENDING')
    or (project_id is not null and public.is_project_team(project_id))
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- OPPORTUNITIES / APPLICATIONS / EVENTS
-- ---------------------------------------------------------------------------
alter table public.opportunities enable row level security;

create policy "opportunities_select_authenticated" on public.opportunities for select to authenticated using (true);
create policy "opportunities_insert" on public.opportunities for insert to authenticated
  with check (posted_by = auth.uid() and (organization_id is null or public.is_org_team(organization_id)));
create policy "opportunities_update" on public.opportunities for update to authenticated
  using (posted_by = auth.uid() or (organization_id is not null and public.is_org_team(organization_id)) or public.is_admin())
  with check (posted_by = auth.uid() or (organization_id is not null and public.is_org_team(organization_id)) or public.is_admin());
create policy "opportunities_delete" on public.opportunities for delete to authenticated
  using (posted_by = auth.uid() or (organization_id is not null and public.is_org_team(organization_id)) or public.is_admin());

alter table public.applications enable row level security;

create policy "applications_select" on public.applications for select to authenticated
  using (
    applicant_id = auth.uid()
    or exists (select 1 from public.opportunities o where o.id = opportunity_id and o.posted_by = auth.uid())
    or public.is_admin()
  );
create policy "applications_insert_own" on public.applications for insert to authenticated
  with check (applicant_id = auth.uid());
create policy "applications_update" on public.applications for update to authenticated
  using (
    applicant_id = auth.uid()
    or exists (select 1 from public.opportunities o where o.id = opportunity_id and o.posted_by = auth.uid())
    or public.is_admin()
  )
  with check (
    applicant_id = auth.uid()
    or exists (select 1 from public.opportunities o where o.id = opportunity_id and o.posted_by = auth.uid())
    or public.is_admin()
  );

alter table public.events enable row level security;

create policy "events_select_authenticated" on public.events for select to authenticated using (true);
create policy "events_insert" on public.events for insert to authenticated
  with check (organizer_id = auth.uid() and (organization_id is null or public.is_org_team(organization_id)));
create policy "events_update" on public.events for update to authenticated
  using (organizer_id = auth.uid() or (organization_id is not null and public.is_org_team(organization_id)) or public.is_admin())
  with check (organizer_id = auth.uid() or (organization_id is not null and public.is_org_team(organization_id)) or public.is_admin());
create policy "events_delete" on public.events for delete to authenticated
  using (organizer_id = auth.uid() or (organization_id is not null and public.is_org_team(organization_id)) or public.is_admin());

-- ---------------------------------------------------------------------------
-- CONNECTIONS / POSTS / COMMENTS / LIKES / REPORTS / NOTIFICATIONS
-- ---------------------------------------------------------------------------
alter table public.connections enable row level security;

create policy "connections_select_own" on public.connections for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid() or public.is_admin());
create policy "connections_insert_own" on public.connections for insert to authenticated
  with check (requester_id = auth.uid());
create policy "connections_update" on public.connections for update to authenticated
  using (addressee_id = auth.uid() or requester_id = auth.uid())
  with check (addressee_id = auth.uid() or requester_id = auth.uid());
create policy "connections_delete_requester" on public.connections for delete to authenticated
  using (requester_id = auth.uid() and status = 'PENDING');

alter table public.posts enable row level security;

create policy "posts_select_authenticated" on public.posts for select to authenticated using (true);
create policy "posts_insert_own" on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy "posts_update_own" on public.posts for update to authenticated
  using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
create policy "posts_delete_own" on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

alter table public.comments enable row level security;

create policy "comments_select_authenticated" on public.comments for select to authenticated using (true);
create policy "comments_insert_own" on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy "comments_update_own" on public.comments for update to authenticated
  using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
create policy "comments_delete_own" on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

alter table public.likes enable row level security;

create policy "likes_select_authenticated" on public.likes for select to authenticated using (true);
create policy "likes_insert_own" on public.likes for insert to authenticated with check (profile_id = auth.uid());
create policy "likes_delete_own" on public.likes for delete to authenticated using (profile_id = auth.uid());

alter table public.reports enable row level security;

create policy "reports_select" on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
create policy "reports_insert_own" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "reports_update_admin" on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications for select to authenticated
  using (profile_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "notifications_insert_admin" on public.notifications for insert to authenticated
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- GOVERNANCE
-- ---------------------------------------------------------------------------
alter table public.proposals enable row level security;

create policy "proposals_select_authenticated" on public.proposals for select to authenticated using (true);
create policy "proposals_insert_authenticated" on public.proposals for insert to authenticated
  with check (created_by = auth.uid());
create policy "proposals_update" on public.proposals for update to authenticated
  using ((created_by = auth.uid() and status = 'DRAFT') or public.is_admin())
  with check ((created_by = auth.uid() and status = 'DRAFT') or public.is_admin());

alter table public.proposal_options enable row level security;

create policy "proposal_options_select_authenticated" on public.proposal_options for select to authenticated using (true);
create policy "proposal_options_insert" on public.proposal_options for insert to authenticated
  with check (
    public.is_admin()
    or exists (select 1 from public.proposals p where p.id = proposal_id and p.created_by = auth.uid() and p.status = 'DRAFT')
  );
create policy "proposal_options_update" on public.proposal_options for update to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.proposals p where p.id = proposal_id and p.created_by = auth.uid() and p.status = 'DRAFT')
  );
create policy "proposal_options_delete" on public.proposal_options for delete to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.proposals p where p.id = proposal_id and p.created_by = auth.uid() and p.status = 'DRAFT')
  );

alter table public.votes enable row level security;

create policy "votes_select_own_or_admin" on public.votes for select to authenticated
  using (profile_id = auth.uid() or public.is_admin());
create policy "votes_insert_own" on public.votes for insert to authenticated
  with check (
    profile_id = auth.uid()
    and exists (
      select 1 from public.proposals p
      where p.id = proposal_id
        and p.status = 'ACTIVE'
        and (p.voting_starts_at is null or p.voting_starts_at <= now())
        and (p.voting_ends_at is null or p.voting_ends_at >= now())
    )
  );
-- No UPDATE or DELETE policy: a cast vote is final.

grant select on public.proposal_results to anon, authenticated;

alter table public.charter_versions enable row level security;

create policy "charter_versions_select_all" on public.charter_versions for select to anon, authenticated using (true);
create policy "charter_versions_insert_admin" on public.charter_versions for insert to authenticated with check (public.is_admin());
create policy "charter_versions_update_admin" on public.charter_versions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

alter table public.charter_proposals enable row level security;

create policy "charter_proposals_select_authenticated" on public.charter_proposals for select to authenticated using (true);
create policy "charter_proposals_insert_own" on public.charter_proposals for insert to authenticated
  with check (proposed_by = auth.uid());
create policy "charter_proposals_update" on public.charter_proposals for update to authenticated
  using ((proposed_by = auth.uid() and status = 'OPEN') or public.is_admin())
  with check ((proposed_by = auth.uid() and status = 'OPEN') or public.is_admin());

-- ---------------------------------------------------------------------------
-- THE CITY — public, read-only transparency; admin-only writes
-- ---------------------------------------------------------------------------
alter table public.cities enable row level security;

create policy "cities_select_all" on public.cities for select to anon, authenticated using (true);
create policy "cities_insert_admin" on public.cities for insert to authenticated with check (public.is_admin());
create policy "cities_update_admin" on public.cities for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "cities_delete_admin" on public.cities for delete to authenticated using (public.is_admin());

alter table public.city_phases enable row level security;

create policy "city_phases_select_all" on public.city_phases for select to anon, authenticated using (true);
create policy "city_phases_insert_admin" on public.city_phases for insert to authenticated with check (public.is_admin());
create policy "city_phases_update_admin" on public.city_phases for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "city_phases_delete_admin" on public.city_phases for delete to authenticated using (public.is_admin());

alter table public.city_updates enable row level security;

create policy "city_updates_select_all" on public.city_updates for select to anon, authenticated using (true);
create policy "city_updates_insert_admin" on public.city_updates for insert to authenticated with check (public.is_admin());
create policy "city_updates_update_admin" on public.city_updates for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "city_updates_delete_admin" on public.city_updates for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- SUBSCRIPTIONS — private billing state; real writes will come from a
-- service-role webhook handler once a payment provider is integrated.
-- ---------------------------------------------------------------------------
alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions for select to authenticated
  using (profile_id = auth.uid() or public.is_admin());
create policy "subscriptions_insert_admin" on public.subscriptions for insert to authenticated with check (public.is_admin());
create policy "subscriptions_update_admin" on public.subscriptions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
