-- Closes the gap behind "connect for a project, then nothing happens":
-- lib/matching/score.ts already knows exactly which of the viewer's own
-- projects motivated a suggested connection (it's in the human-readable
-- reason text), but that project identity was never carried onto the
-- connections row itself, so it was impossible to show either party what
-- the connection was about after the fact, or to link to the project as
-- a next action. This column is purely additive metadata — nullable, so
-- plain person-to-person connects (Discover's People tab) are unaffected.

alter table public.connections
  add column project_id uuid references public.projects (id) on delete set null;

create index connections_project_idx on public.connections (project_id);

-- Security fix found while auditing this table: the existing
-- connections_update policy allowed EITHER party to update a row's status,
-- which means a requester could accept their own outgoing request directly
-- via the API/client, bypassing the addressee's consent entirely (the
-- respondToConnectionAction server action already scoped correctly to
-- addressee_id, but the RLS policy underneath it did not, so it was
-- exploitable by any direct client call that skipped the app's own UI).
-- The requester's only legitimate write today is canceling their own
-- pending request, which is already handled by connections_delete_requester
-- — they never had a legitimate reason to UPDATE a row they sent.
drop policy if exists "connections_update" on public.connections;

create policy "connections_update_addressee" on public.connections for update to authenticated
  using (addressee_id = auth.uid())
  with check (addressee_id = auth.uid());

-- Enrich the existing notification triggers with project context, without
-- changing their shape (still one row in public.notifications, still a
-- plain title/body/link the existing bell and /notifications page already
-- render generically).
create or replace function public.notify_new_connection_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_name text;
  project_name text;
begin
  if new.status = 'PENDING' then
    select coalesce(full_name, username, 'Someone') into requester_name
    from public.profiles where id = new.requester_id;

    if new.project_id is not null then
      select name into project_name from public.projects where id = new.project_id;
    end if;

    insert into public.notifications (profile_id, type, title, body, link)
    values (
      new.addressee_id,
      'CONNECTION_REQUEST',
      'New connection request',
      case
        when project_name is not null then
          requester_name || ' wants to connect about your project "' || project_name || '".'
        else
          requester_name || ' wants to connect.'
      end,
      '/passport/connections'
    );
  end if;
  return new;
end;
$$;

-- The accepted-side notification now links somewhere more useful than the
-- generic connections list: straight to the project if this connection was
-- about one, otherwise to the new connection's Passport.
create or replace function public.notify_connection_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  addressee_name text;
  project_name text;
begin
  if new.status = 'ACCEPTED' and old.status is distinct from 'ACCEPTED' then
    select coalesce(full_name, username, 'Someone') into addressee_name
    from public.profiles where id = new.addressee_id;

    if new.project_id is not null then
      select name into project_name from public.projects where id = new.project_id;
    end if;

    insert into public.notifications (profile_id, type, title, body, link)
    values (
      new.requester_id,
      'CONNECTION_ACCEPTED',
      'Connection accepted',
      case
        when project_name is not null then
          addressee_name || ' accepted your connection request about "' || project_name || '".'
        else
          addressee_name || ' accepted your connection request.'
      end,
      case when new.project_id is not null then '/build/' || new.project_id else '/passport/' || new.addressee_id end
    );
  end if;
  return new;
end;
$$;
