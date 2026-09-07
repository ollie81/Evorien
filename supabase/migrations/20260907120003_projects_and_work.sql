-- The builder economy: organizations, projects, contributions and opportunities.

-- ---------------------------------------------------------------------------
-- ORGANIZATIONS
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  website text,
  logo_url text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'MEMBER' check (role in ('OWNER', 'ADMIN', 'MEMBER')),
  created_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create index organization_members_org_idx on public.organization_members (organization_id);
create index organization_members_profile_idx on public.organization_members (profile_id);

create or replace function public.is_org_team(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = p_org_id
      and profile_id = auth.uid()
      and role in ('OWNER', 'ADMIN')
  );
$$;

-- ---------------------------------------------------------------------------
-- PROJECTS
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,

  name text not null,
  slug text not null unique,
  tagline text,
  description text,

  pillar_code text references public.pillars (code),
  category text,
  stage text not null default 'IDEA' check (stage in ('IDEA', 'PROTOTYPE', 'MVP', 'LAUNCHED', 'GROWING')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED')),

  country text,
  city text,
  website text,
  cover_image_url text,
  looking_for text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint projects_name_length check (char_length(name) between 2 and 120)
);

create index projects_owner_idx on public.projects (owner_id);
create index projects_pillar_idx on public.projects (pillar_code);
create index projects_stage_idx on public.projects (stage);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'MEMBER' check (role in ('OWNER', 'ADMIN', 'MEMBER')),
  status text not null default 'ACTIVE' check (status in ('INVITED', 'PENDING', 'ACTIVE', 'LEFT', 'REMOVED')),
  joined_at timestamptz not null default now(),
  unique (project_id, profile_id)
);

create index project_members_project_idx on public.project_members (project_id);
create index project_members_profile_idx on public.project_members (profile_id);

create or replace function public.is_project_team(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id
      and profile_id = auth.uid()
      and role in ('OWNER', 'ADMIN')
      and status = 'ACTIVE'
  );
$$;

-- Automatically add the creator as OWNER team member the moment a project is created.
create or replace function public.handle_new_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_members (project_id, profile_id, role, status)
  values (new.id, new.owner_id, 'OWNER', 'ACTIVE');
  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_new_project();

create table public.project_skills (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  is_filled boolean not null default false,
  unique (project_id, skill_id)
);

create index project_skills_project_idx on public.project_skills (project_id);

-- ---------------------------------------------------------------------------
-- CONTRIBUTIONS ("what I can contribute" / "what I need", logged and tracked)
-- ---------------------------------------------------------------------------
create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  type text not null check (type in (
    'SKILLS', 'TIME', 'KNOWLEDGE', 'CREATIVITY', 'ENGINEERING',
    'BUSINESS', 'COMMUNITY', 'EQUIPMENT', 'MENTORSHIP', 'OTHER'
  )),
  title text not null,
  description text,
  status text not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'DECLINED')),
  reviewed_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contributions_profile_idx on public.contributions (profile_id);
create index contributions_project_idx on public.contributions (project_id);

create trigger contributions_set_updated_at
  before update on public.contributions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- OPPORTUNITIES + APPLICATIONS
-- ---------------------------------------------------------------------------
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,

  title text not null,
  description text not null,
  type text not null check (type in (
    'JOB', 'FREELANCE', 'COLLABORATION', 'EVENT', 'PARTNERSHIP', 'GRANT', 'COMPETITION', 'PROJECT'
  )),
  pillar_code text references public.pillars (code),
  location text,
  is_remote boolean not null default false,
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED', 'FILLED')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index opportunities_posted_by_idx on public.opportunities (posted_by);
create index opportunities_pillar_idx on public.opportunities (pillar_code);
create index opportunities_status_idx on public.opportunities (status);

create trigger opportunities_set_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  message text,
  status text not null default 'SUBMITTED' check (status in ('SUBMITTED', 'REVIEWED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opportunity_id, applicant_id)
);

create index applications_opportunity_idx on public.applications (opportunity_id);
create index applications_applicant_idx on public.applications (applicant_id);

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- EVENTS
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  title text not null,
  description text,
  pillar_code text references public.pillars (code),
  location text,
  is_online boolean not null default false,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED', 'CANCELLED', 'COMPLETED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_end_after_start check (ends_at is null or ends_at >= starts_at)
);

create index events_starts_at_idx on public.events (starts_at);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();
