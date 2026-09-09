-- Evorien AI: user-controlled memory, kept as a system fully separate from
-- chat history (ai_conversations/ai_messages). A memory is a short,
-- distilled fact the model chose to save via the save_memory tool — never
-- an automatic copy of a message — and it must outlive the conversation it
-- came from, which is why source_conversation_id is "on delete set null"
-- rather than cascade.
--
-- No 'SKILL' memory_type on purpose: skills are already a verified,
-- structured Passport field (profile_skills) — memory must never become a
-- second, unverified source of truth for something already checkable.

create table public.ai_memories (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  memory_type text not null check (memory_type in ('GOAL', 'INTEREST', 'PREFERENCE', 'PROJECT_CONTEXT', 'DECISION')),
  content text not null,
  source_conversation_id uuid references public.ai_conversations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_memories_profile_idx on public.ai_memories (profile_id, created_at desc);

create trigger ai_memories_set_updated_at
  before update on public.ai_memories
  for each row execute function public.set_updated_at();

alter table public.ai_memories enable row level security;

-- Own-row-only, no admin-override clause at all: memories are as private
-- as ai_conversations/ai_messages, not admin-readable like the ai_usage
-- ledger. No update policy — a memory is created or deleted, never edited
-- in place.
create policy "ai_memories_select_own" on public.ai_memories for select to authenticated
  using (profile_id = auth.uid());
create policy "ai_memories_insert_own" on public.ai_memories for insert to authenticated
  with check (profile_id = auth.uid());
create policy "ai_memories_delete_own" on public.ai_memories for delete to authenticated
  using (profile_id = auth.uid());

-- Account-wide opt-out, matching the existing simple-boolean-on-profiles
-- precedent (onboarding_completed). Turning this off stops both reading
-- and writing memory for that member — see lib/ai/memory.ts.
alter table public.profiles add column ai_memory_enabled boolean not null default true;
