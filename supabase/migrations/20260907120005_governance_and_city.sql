-- Governance laboratory + The City vision. Community votes only — never
-- government elections, never legally binding, never presented as existing
-- territory. See charter/vision copy in the Flutter app for the disclaimers.

-- ---------------------------------------------------------------------------
-- PROPOSALS / VOTES ("one member = one vote", enforced at the database level)
-- ---------------------------------------------------------------------------
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED')),
  voting_starts_at timestamptz,
  voting_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proposals_voting_window check (voting_ends_at is null or voting_starts_at is null or voting_ends_at > voting_starts_at)
);

create index proposals_status_idx on public.proposals (status);

create trigger proposals_set_updated_at
  before update on public.proposals
  for each row execute function public.set_updated_at();

create table public.proposal_options (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  label text not null,
  sort_order int not null default 0
);

create index proposal_options_proposal_idx on public.proposal_options (proposal_id);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  option_id uuid not null references public.proposal_options (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- The core governance guarantee: one member can cast at most one vote per proposal.
  unique (proposal_id, profile_id)
);

create index votes_proposal_idx on public.votes (proposal_id);

-- Public, aggregate-only results (no individual ballots exposed) so
-- participation and outcomes stay transparent without a public voter list.
create view public.proposal_results as
select
  o.proposal_id,
  o.id as option_id,
  o.label,
  count(v.id) as vote_count
from public.proposal_options o
left join public.votes v on v.option_id = o.id
group by o.proposal_id, o.id, o.label;

-- ---------------------------------------------------------------------------
-- COMMUNITY CHARTER
-- ---------------------------------------------------------------------------
create table public.charter_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  title text not null,
  content text not null,
  is_current boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- Partial unique index: at most one charter version may be "current" at a time.
create unique index charter_versions_one_current on public.charter_versions ((is_current)) where is_current;

create table public.charter_proposals (
  id uuid primary key default gen_random_uuid(),
  charter_version_id uuid references public.charter_versions (id) on delete set null,
  proposed_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED')),
  linked_proposal_id uuid references public.proposals (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index charter_proposals_status_idx on public.charter_proposals (status);

create trigger charter_proposals_set_updated_at
  before update on public.charter_proposals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- THE CITY (multi-city, location-agnostic — never hard-coded to one place)
-- ---------------------------------------------------------------------------
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  status text not null default 'RESEARCH' check (
    status in ('RESEARCH', 'PROPOSED', 'NEGOTIATION', 'PLANNING', 'DEVELOPMENT', 'OPERATIONAL')
  ),
  description text,
  latitude double precision,
  longitude double precision,
  hero_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger cities_set_updated_at
  before update on public.cities
  for each row execute function public.set_updated_at();

create table public.city_phases (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  phase_number int not null check (phase_number in (1, 2, 3)),
  name text not null,
  hectares_min int,
  hectares_max int,
  status text not null default 'PROPOSED' check (status in ('PROPOSED', 'IN_PROGRESS', 'COMPLETED')),
  features text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (city_id, phase_number)
);

create table public.city_updates (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  posted_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index city_updates_city_idx on public.city_updates (city_id, created_at desc);
