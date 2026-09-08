-- Closes the same kind of gap as 20260908120003_build_notifications.sql,
-- here for the connections feature: on_connection_accepted (see
-- 20260908120001_reputation_triggers.sql) already awards reputation to both
-- members when a connection is accepted, but nothing ever told the person
-- who SENT the request that it was accepted — they'd only find out by
-- manually revisiting Discover or their own network page.

create or replace function public.notify_connection_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'ACCEPTED' and old.status is distinct from 'ACCEPTED' then
    insert into public.notifications (profile_id, type, title, body, link)
    values (
      new.requester_id,
      'CONNECTION_ACCEPTED',
      'Connection accepted',
      (select coalesce(full_name, username, 'Someone') from public.profiles where id = new.addressee_id)
        || ' accepted your connection request.',
      '/passport/connections'
    );
  end if;
  return new;
end;
$$;

create trigger on_connection_accepted_notify
  after update on public.connections
  for each row execute function public.notify_connection_accepted();
