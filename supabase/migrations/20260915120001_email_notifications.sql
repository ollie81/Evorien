-- =============================================================================
-- EMAIL NOTIFICATIONS
--
-- Notifications are created by SECURITY DEFINER triggers, not by application
-- code, so email has to originate here too. That also solves a security
-- problem: a member's session must never be able to read another member's
-- email address, and with this design the app never reads one at all. The
-- database (which legitimately can see auth.users.email) pushes exactly the
-- fields the mailer needs to an HTTPS endpoint, and the app only ever
-- forwards them to the email provider. No service-role key is involved.
--
-- Delivery is via pg_net, which queues the request and returns immediately —
-- it does not block or lengthen the transaction that created the notification.
--
-- Everything below is additionally wrapped so that ANY failure in the email
-- path (extension missing, config absent, bad row, network error) is swallowed
-- and the notification insert still succeeds. A notification trigger taking
-- down the action that caused it is not hypothetical here: a missing RETURN in
-- notify_new_message() previously rolled back every message send.
-- =============================================================================

alter table public.profiles
  add column if not exists email_notifications_enabled boolean not null default true;

create extension if not exists pg_net;

-- Holds the webhook endpoint and shared secret. RLS is enabled with NO
-- policies at all, so this table is completely invisible through PostgREST to
-- every role — only SECURITY DEFINER functions like the trigger below can read
-- it. The values are inserted manually (see README), never committed to git.
create table if not exists public.private_config (
  key text primary key,
  value text not null
);

alter table public.private_config enable row level security;

-- Which notification types are worth an email. Deliberately an allowlist, so a
-- new notification type added later is in-app only until someone opts it in
-- here — noise fails closed rather than open.
create or replace function public.email_worthy_notification(p_type text)
returns boolean
language sql
immutable
as $$
  select p_type in (
    'CONNECTION_REQUEST',
    'CONNECTION_ACCEPTED',
    'MESSAGE_RECEIVED',
    'VERIFICATION_APPROVED',
    'VERIFICATION_REJECTED'
  );
$$;

create or replace function public.notify_by_email()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  recipient_email text;
  recipient_opted_in boolean;
  webhook_url text;
  webhook_secret text;
  recent_message_email_count int;
begin
  begin
    if not public.email_worthy_notification(new.type) then
      return new;
    end if;

    select p.email_notifications_enabled, u.email
      into recipient_opted_in, recipient_email
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = new.profile_id;

    if recipient_email is null or recipient_opted_in is not true then
      return new;
    end if;

    -- Burst guard: a back-and-forth conversation should not produce one email
    -- per message. If this member was already emailed about a message in the
    -- last 15 minutes, the in-app notification stands on its own.
    if new.type = 'MESSAGE_RECEIVED' then
      select count(*) into recent_message_email_count
      from public.notifications n
      where n.profile_id = new.profile_id
        and n.type = 'MESSAGE_RECEIVED'
        and n.id <> new.id
        and n.created_at > now() - interval '15 minutes';

      if recent_message_email_count > 0 then
        return new;
      end if;
    end if;

    select value into webhook_url from public.private_config where key = 'email_webhook_url';
    select value into webhook_secret from public.private_config where key = 'email_webhook_secret';

    if webhook_url is null or webhook_secret is null then
      return new;
    end if;

    perform net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Ollieen-Signature', webhook_secret
      ),
      body := jsonb_build_object(
        'to', recipient_email,
        'type', new.type,
        'title', new.title,
        'body', new.body,
        'link', new.link
      ),
      timeout_milliseconds := 5000
    );
  exception
    when others then
      -- Never let the email path break the notification, or the action that
      -- created it. The in-app notification is the source of truth.
      return new;
  end;

  return new;
end;
$$;

drop trigger if exists on_notification_send_email on public.notifications;

create trigger on_notification_send_email
  after insert on public.notifications
  for each row execute function public.notify_by_email();
