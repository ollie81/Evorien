-- Community layer: connections, posts, comments, likes, reports, notifications.
-- Deliberately thin — the product favors building and contributing over
-- engagement-for-its-own-sake, per the Evorien product principles.

-- ---------------------------------------------------------------------------
-- CONNECTIONS
-- ---------------------------------------------------------------------------
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'DECLINED', 'BLOCKED')),
  -- Sorted pair, generated so (A,B) and (B,A) can never both exist as separate rows.
  low_id uuid generated always as (least(requester_id, addressee_id)) stored,
  high_id uuid generated always as (greatest(requester_id, addressee_id)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connections_no_self check (requester_id <> addressee_id),
  unique (low_id, high_id)
);

create index connections_requester_idx on public.connections (requester_id);
create index connections_addressee_idx on public.connections (addressee_id);

create trigger connections_set_updated_at
  before update on public.connections
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- POSTS, COMMENTS, LIKES
-- ---------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  content text not null check (char_length(content) between 1 and 5000),
  pillar_code text references public.pillars (code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_author_idx on public.posts (author_id);
create index posts_project_idx on public.posts (project_id);
create index posts_created_at_idx on public.posts (created_at desc);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_post_idx on public.comments (post_id);

create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

create table public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, profile_id)
);

create index likes_post_idx on public.likes (post_id);

-- ---------------------------------------------------------------------------
-- REPORTS (abuse / moderation)
-- ---------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('POST', 'COMMENT', 'PROFILE', 'PROJECT', 'OPPORTUNITY')),
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'OPEN' check (status in ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED')),
  reviewed_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reports_status_idx on public.reports (status);

create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_profile_idx on public.notifications (profile_id, is_read);

-- A new connection request notifies the addressee. security definer so the
-- requester (who cannot INSERT into another member's notifications) can still
-- trigger this through the normal connections INSERT.
create or replace function public.notify_new_connection_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'PENDING' then
    insert into public.notifications (profile_id, type, title, body, link)
    values (
      new.addressee_id,
      'CONNECTION_REQUEST',
      'New connection request',
      (select coalesce(full_name, username, 'Someone') from public.profiles where id = new.requester_id) || ' wants to connect.',
      '/passport/connections'
    );
  end if;
  return new;
end;
$$;

create trigger on_connection_created
  after insert on public.connections
  for each row execute function public.notify_new_connection_request();
