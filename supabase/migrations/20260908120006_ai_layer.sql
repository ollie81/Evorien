-- Evorien AI, Stage 2: the minimum schema for a secure, budget-aware AI
-- server integration. Nothing here reads from or writes to any existing
-- table — it's purely additive, three new tables with the same per-row
-- RLS pattern used everywhere else in this schema (a member can only ever
-- see and write their own rows; admins get read access to usage for cost
-- visibility, matching reputation_events' existing precedent).
--
-- ai_conversations / ai_messages exist now so Stage 3 (the real chat UI)
-- has somewhere to persist history without a second migration, but nothing
-- writes to them yet. ai_usage is live from Stage 2 itself — every AI
-- request is logged here and it's what the per-user daily rate limit
-- counts against.

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_conversations_profile_idx on public.ai_conversations (profile_id, updated_at desc);

create trigger ai_conversations_set_updated_at
  before update on public.ai_conversations
  for each row execute function public.set_updated_at();

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index ai_messages_conversation_idx on public.ai_messages (conversation_id, created_at);

-- Deliberately does not store message content — just enough to count
-- requests for rate limiting and estimate cost. profile_id is denormalized
-- (not joined through conversation_id) so usage is still trackable even
-- for a request that isn't part of a saved conversation.
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  conversation_id uuid references public.ai_conversations (id) on delete set null,
  model text not null,
  request_type text not null default 'chat',
  prompt_tokens integer,
  completion_tokens integer,
  created_at timestamptz not null default now()
);

create index ai_usage_profile_created_idx on public.ai_usage (profile_id, created_at);

alter table public.ai_conversations enable row level security;

create policy "ai_conversations_select_own" on public.ai_conversations for select to authenticated
  using (profile_id = auth.uid());
create policy "ai_conversations_insert_own" on public.ai_conversations for insert to authenticated
  with check (profile_id = auth.uid());
create policy "ai_conversations_update_own" on public.ai_conversations for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "ai_conversations_delete_own" on public.ai_conversations for delete to authenticated
  using (profile_id = auth.uid());

alter table public.ai_messages enable row level security;

create policy "ai_messages_select_own" on public.ai_messages for select to authenticated
  using (exists (
    select 1 from public.ai_conversations c where c.id = conversation_id and c.profile_id = auth.uid()
  ));
create policy "ai_messages_insert_own" on public.ai_messages for insert to authenticated
  with check (exists (
    select 1 from public.ai_conversations c where c.id = conversation_id and c.profile_id = auth.uid()
  ));
create policy "ai_messages_delete_own" on public.ai_messages for delete to authenticated
  using (exists (
    select 1 from public.ai_conversations c where c.id = conversation_id and c.profile_id = auth.uid()
  ));

alter table public.ai_usage enable row level security;

-- No update/delete policy at all — like reputation_events, this is an
-- append-only ledger, not a record members or admins edit.
create policy "ai_usage_select_own_or_admin" on public.ai_usage for select to authenticated
  using (profile_id = auth.uid() or public.is_admin());
create policy "ai_usage_insert_own" on public.ai_usage for insert to authenticated
  with check (profile_id = auth.uid());
