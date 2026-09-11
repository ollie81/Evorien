-- =============================================================================
-- MESSAGING — extends the connections model rather than duplicating it.
-- One conversation per ACCEPTED connection (unique on connection_id), so
-- "can I see/write here" reduces to the exact same party-membership check
-- connections RLS already uses. No new participants table needed.
-- =============================================================================

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (connection_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);
create index messages_unread_idx on public.messages (conversation_id, sender_id) where read_at is null;

-- Defense in depth beyond RLS: the only legitimate update to an existing
-- message is marking it read. Even a party to the conversation calling the
-- API directly (bypassing the app's own markConversationReadAction) cannot
-- rewrite history — this guards column-level integrity that a row-level
-- policy alone can't express.
create or replace function public.guard_message_immutability()
returns trigger
language plpgsql
as $$
begin
  if new.content is distinct from old.content
    or new.sender_id is distinct from old.sender_id
    or new.conversation_id is distinct from old.conversation_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Messages cannot be edited, only marked read.';
  end if;
  return new;
end;
$$;

create trigger messages_guard_immutability
  before update on public.messages
  for each row execute function public.guard_message_immutability();

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "conversations_select_own" on public.conversations for select to authenticated
  using (
    exists (
      select 1 from public.connections c
      where c.id = conversations.connection_id
        and (c.requester_id = auth.uid() or c.addressee_id = auth.uid())
    )
  );

create policy "conversations_insert_own" on public.conversations for insert to authenticated
  with check (
    exists (
      select 1 from public.connections c
      where c.id = conversations.connection_id
        and c.status = 'ACCEPTED'
        and (c.requester_id = auth.uid() or c.addressee_id = auth.uid())
    )
  );

-- Needed so sendMessageAction can bump last_message_at directly (same
-- pattern as ai_conversations.updated_at in lib/ai/conversation.ts) without
-- a second trigger; the with check keeps the row pinned to the same
-- connection membership rather than allowing it to be reassigned.
create policy "conversations_update_own" on public.conversations for update to authenticated
  using (
    exists (
      select 1 from public.connections c
      where c.id = conversations.connection_id
        and (c.requester_id = auth.uid() or c.addressee_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.connections c
      where c.id = conversations.connection_id
        and (c.requester_id = auth.uid() or c.addressee_id = auth.uid())
    )
  );

create policy "messages_select_own_conversation" on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.conversations conv
      join public.connections c on c.id = conv.connection_id
      where conv.id = messages.conversation_id
        and (c.requester_id = auth.uid() or c.addressee_id = auth.uid())
    )
  );

create policy "messages_insert_own_conversation" on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations conv
      join public.connections c on c.id = conv.connection_id
      where conv.id = messages.conversation_id
        and c.status = 'ACCEPTED'
        and (c.requester_id = auth.uid() or c.addressee_id = auth.uid())
    )
  );

-- Only the RECIPIENT marks a message read — you can't mark your own sent
-- messages, and the immutability trigger above stops anything but read_at
-- from actually changing regardless.
create policy "messages_update_mark_read" on public.messages for update to authenticated
  using (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.conversations conv
      join public.connections c on c.id = conv.connection_id
      where conv.id = messages.conversation_id
        and (c.requester_id = auth.uid() or c.addressee_id = auth.uid())
    )
  )
  with check (sender_id <> auth.uid());

-- New message -> notify the other party. security definer so the sender
-- (who cannot insert into another member's notifications) can still
-- trigger this through the normal messages INSERT.
create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_id uuid;
  sender_name text;
begin
  select case when c.requester_id = new.sender_id then c.addressee_id else c.requester_id end
    into recipient_id
  from public.conversations conv
  join public.connections c on c.id = conv.connection_id
  where conv.id = new.conversation_id;

  select coalesce(full_name, username, 'Someone') into sender_name
  from public.profiles where id = new.sender_id;

  insert into public.notifications (profile_id, type, title, body, link)
  values (
    recipient_id,
    'MESSAGE_RECEIVED',
    'New message',
    sender_name || ' sent you a message.',
    '/messages/' || new.conversation_id
  );
end;
$$;

create trigger on_message_created_notify
  after insert on public.messages
  for each row execute function public.notify_new_message();

-- =============================================================================
-- VERIFICATION REVIEW — admin-facing gaps closed: an optional reason on
-- rejection, and notifications for submission/approval/rejection that
-- didn't exist before (only skill-verification had one, see
-- 20260908120005_skill_verified_notification.sql).
-- =============================================================================

alter table public.verifications add column rejection_reason text;

create or replace function public.notify_verification_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_name text;
begin
  select coalesce(full_name, username, 'Someone') into requester_name
  from public.profiles where id = new.profile_id;

  insert into public.notifications (profile_id, type, title, body, link)
  select id, 'VERIFICATION_SUBMITTED', 'New verification request',
    requester_name || ' requested ' || new.requested_level || ' verification.',
    '/admin/verifications'
  from public.profiles where is_admin = true;
end;
$$;

create trigger on_verification_submitted_notify
  after insert on public.verifications
  for each row execute function public.notify_verification_submitted();

create or replace function public.notify_verification_reviewed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'APPROVED' and old.status is distinct from 'APPROVED' then
    insert into public.notifications (profile_id, type, title, body, link)
    values (
      new.profile_id, 'VERIFICATION_APPROVED', 'Verification approved',
      'Your ' || new.requested_level || ' request was approved.', '/passport'
    );
  elsif new.status = 'REJECTED' and old.status is distinct from 'REJECTED' then
    insert into public.notifications (profile_id, type, title, body, link)
    values (
      new.profile_id, 'VERIFICATION_REJECTED', 'Verification request declined',
      case
        when new.rejection_reason is not null then 'Your ' || new.requested_level || ' request was declined: ' || new.rejection_reason
        else 'Your ' || new.requested_level || ' request was declined.'
      end,
      '/passport'
    );
  end if;
  return new;
end;
$$;

create trigger on_verification_reviewed_notify
  after update on public.verifications
  for each row execute function public.notify_verification_reviewed();
