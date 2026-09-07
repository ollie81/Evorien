-- Identity core: the Evorien Passport, pillars, skills, verification and reputation.

-- ---------------------------------------------------------------------------
-- PROFILES + PASSPORT ID
-- ---------------------------------------------------------------------------
-- Every profile IS an Evorien Passport. passport_number comes from a sequence
-- (safe under concurrent signups), and passport_id ("EVR-000001") is derived
-- from it by the database itself, so it can never be forged or duplicated
-- client-side.
create sequence if not exists public.passport_number_seq start with 1 increment by 1;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  passport_number bigint not null unique default nextval('public.passport_number_seq'),
  passport_id text generated always as ('EVR-' || lpad(passport_number::text, 6, '0')) stored unique,

  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  country text,
  city text,
  website text,

  -- Free-form arrays of app-level enum codes (validated in the Flutter app).
  -- See lib/core/constants for the canonical role and pillar lists.
  roles text[] not null default '{}',
  pillars text[] not null default '{}',

  looking_for text,
  contribution_summary text,

  verification_level text not null default 'BASIC',
  reputation_level text not null default 'MEMBER',

  is_admin boolean not null default false,
  onboarding_completed boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_username_format check (
    username is null or username ~ '^[a-z0-9_]{3,24}$'
  ),
  constraint profiles_verification_level_check check (
    verification_level in ('BASIC', 'IDENTITY_VERIFIED', 'SKILL_VERIFIED', 'FOUNDER_VERIFIED')
  ),
  constraint profiles_reputation_level_check check (
    reputation_level in ('MEMBER', 'CONTRIBUTOR', 'BUILDER', 'TRUSTED_BUILDER', 'FOUNDING_CONTRIBUTOR')
  )
);

comment on table public.profiles is 'The Evorien Passport: one row per member, one-to-one with auth.users.';
comment on column public.profiles.passport_id is 'Public membership identity, e.g. EVR-000001. Not a government ID.';

create index profiles_country_idx on public.profiles (country);
create index profiles_roles_idx on public.profiles using gin (roles);
create index profiles_pillars_idx on public.profiles using gin (pillars);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Every new auth user immediately gets a Passport, before onboarding even
-- starts. security definer lets this bypass RLS to perform the insert.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin-check helper. security definer + stable so it can be used inside RLS
-- policies on public.profiles itself without infinite recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- PILLARS (reference data: Technology, Digital Economy, Entertainment, Arts, Tourism)
-- ---------------------------------------------------------------------------
create table public.pillars (
  code text primary key,
  name text not null,
  description text,
  sort_order int not null default 0
);

insert into public.pillars (code, name, description, sort_order) values
  ('TECHNOLOGY', 'Technology', 'AI, software, robotics, infrastructure, startups and innovation.', 1),
  ('DIGITAL_ECONOMY', 'Digital Economy', 'Cryptocurrency, blockchain and digital economic experimentation.', 2),
  ('ENTERTAINMENT', 'Entertainment', 'Film, video, gaming, events, music, experiences.', 3),
  ('ARTS', 'Arts', 'Artists, designers, musicians, writers, filmmakers, architects.', 4),
  ('TOURISM', 'Tourism', 'Hospitality, experiences, travel, events, culture, future destinations.', 5);

-- ---------------------------------------------------------------------------
-- SKILLS (open, community-extensible catalog)
-- ---------------------------------------------------------------------------
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  created_at timestamptz not null default now()
);

create table public.profile_skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  proficiency text check (proficiency in ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (profile_id, skill_id)
);

create index profile_skills_profile_idx on public.profile_skills (profile_id);
create index profile_skills_skill_idx on public.profile_skills (skill_id);

-- ---------------------------------------------------------------------------
-- VERIFICATION
-- ---------------------------------------------------------------------------
create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  requested_level text not null check (requested_level in ('IDENTITY_VERIFIED', 'SKILL_VERIFIED', 'FOUNDER_VERIFIED')),
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  notes text,
  -- Path inside the private "verification-evidence" storage bucket. Never a public URL.
  evidence_path text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index verifications_profile_idx on public.verifications (profile_id);
create index verifications_status_idx on public.verifications (status);

-- ---------------------------------------------------------------------------
-- REPUTATION (event-sourced — never a directly editable score)
-- ---------------------------------------------------------------------------
create table public.reputation_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null check (event_type in (
    'PROJECT_COMPLETED', 'PROJECT_JOINED', 'SKILL_VERIFIED', 'COMMUNITY_HELP',
    'EVENT_ORGANIZED', 'CONTRIBUTION_ACCEPTED', 'CONNECTION_MADE',
    'PROPOSAL_CREATED', 'VOTE_CAST'
  )),
  source_table text,
  source_id uuid,
  points int not null check (points > 0),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index reputation_events_profile_idx on public.reputation_events (profile_id);

comment on table public.reputation_events is
  'Append-only ledger. A profile''s reputation score is always the SUM of its events — never a stored, directly editable column.';

-- ---------------------------------------------------------------------------
-- ACHIEVEMENTS
-- ---------------------------------------------------------------------------
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  icon text,
  awarded_at timestamptz not null default now(),
  unique (profile_id, code)
);

create index achievements_profile_idx on public.achievements (profile_id);
