-- Read-optimized views for screens that need aggregates rather than raw rows.

-- Public reputation score per profile. Runs with the view owner's privileges
-- (standard Postgres view behavior), so it can sum every profile's
-- reputation_events even though that table itself is locked to
-- own-profile-or-admin — individual events stay private, the total is the
-- public, showcaseable number on a Passport.
create or replace view public.profile_reputation_scores as
select
  p.id as profile_id,
  coalesce(sum(e.points), 0)::bigint as reputation_score
from public.profiles p
left join public.reputation_events e on e.profile_id = p.id
group by p.id;

grant select on public.profile_reputation_scores to anon, authenticated;

-- Live, truthful platform-growth counters for the Home screen. Never
-- hard-code or fabricate these numbers in the app — always read them from
-- here so the product never overstates its own traction.
create or replace view public.network_stats as
select
  (select count(*) from public.profiles where onboarding_completed) as member_count,
  (select count(*) from public.projects where status = 'ACTIVE') as active_project_count,
  (select count(distinct country) from public.profiles where country is not null and onboarding_completed) as country_count,
  (select count(*) from public.profiles where verification_level <> 'BASIC') as verified_contributor_count;

grant select on public.network_stats to anon, authenticated;
