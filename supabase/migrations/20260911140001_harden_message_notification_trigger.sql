-- Fixes a real bug, not just hardening: both functions below were declared
-- `returns trigger` but their function bodies could reach the end of the
-- block without ever executing a RETURN statement. PL/pgSQL requires a
-- RETURN from any code path that can be reached in a non-void function —
-- reaching the end without one raises "control reached end of function
-- without RETURN" at runtime, unconditionally, every time the trigger
-- fires. That is why every attempt to send a message failed outright: the
-- INSERT into messages runs the AFTER INSERT trigger in the same
-- transaction, so the trigger's error rolled back the whole send.
-- Submitting a verification request (notify_verification_submitted) had
-- the identical bug and would fail the same way once exercised.
--
-- Also hardens notify_new_message so a failure to resolve who to notify
-- can never block the message itself: the previous body unconditionally
-- inserted into notifications (profile_id not null) right after a plain
-- (non-strict) lookup, so a lookup that found no row would still attempt
-- a null insert and roll back the send for an unrelated reason.
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

  if recipient_id is not null then
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
  end if;

  return new;
end;
$$;

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

  return new;
end;
$$;
