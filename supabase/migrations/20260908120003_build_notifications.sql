-- Notifies members about BUILD-ecosystem events that already happen today —
-- an application arrives, a contribution or application gets decided,
-- someone joins your project — but that nobody could ever see without
-- manually revisiting the page. Same security definer pattern as
-- notify_new_connection_request() (see 20260907120004_community.sql): the
-- acting member can't INSERT into someone else's notifications directly
-- (notifications_insert_admin requires is_admin()), so these triggers are
-- the controlled, server-verified path around that.

-- ---------------------------------------------------------------------------
-- APPLICATION_RECEIVED — someone applies to an opportunity you posted.
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  opp record;
begin
  select posted_by, title into opp from public.opportunities where id = new.opportunity_id;

  if opp.posted_by is not null and opp.posted_by <> new.applicant_id then
    insert into public.notifications (profile_id, type, title, body, link)
    values (
      opp.posted_by,
      'APPLICATION_RECEIVED',
      'New application',
      (select coalesce(full_name, username, 'Someone') from public.profiles where id = new.applicant_id)
        || ' applied to "' || opp.title || '".',
      '/build?tab=opportunities'
    );
  end if;
  return new;
end;
$$;

create trigger on_application_created
  after insert on public.applications
  for each row execute function public.notify_new_application();

-- ---------------------------------------------------------------------------
-- APPLICATION_ACCEPTED / APPLICATION_REJECTED — the poster decides.
-- ---------------------------------------------------------------------------
create or replace function public.notify_application_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  opp_title text;
begin
  if new.status in ('ACCEPTED', 'REJECTED') and old.status is distinct from new.status then
    select title into opp_title from public.opportunities where id = new.opportunity_id;

    insert into public.notifications (profile_id, type, title, body, link)
    values (
      new.applicant_id,
      case when new.status = 'ACCEPTED' then 'APPLICATION_ACCEPTED' else 'APPLICATION_REJECTED' end,
      case when new.status = 'ACCEPTED' then 'Application accepted' else 'Application update' end,
      case
        when new.status = 'ACCEPTED' then 'You were accepted for "' || coalesce(opp_title, 'an opportunity') || '".'
        else 'You were not selected for "' || coalesce(opp_title, 'an opportunity') || '".'
      end,
      '/build?tab=opportunities'
    );
  end if;
  return new;
end;
$$;

create trigger on_application_decided
  after update on public.applications
  for each row execute function public.notify_application_decision();

-- ---------------------------------------------------------------------------
-- CONTRIBUTION_ACCEPTED / CONTRIBUTION_DECLINED — a project team decides.
-- ---------------------------------------------------------------------------
create or replace function public.notify_contribution_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  project_name text;
begin
  if new.status in ('ACCEPTED', 'DECLINED') and old.status is distinct from new.status then
    if new.project_id is not null then
      select name into project_name from public.projects where id = new.project_id;
    end if;

    insert into public.notifications (profile_id, type, title, body, link)
    values (
      new.profile_id,
      case when new.status = 'ACCEPTED' then 'CONTRIBUTION_ACCEPTED' else 'CONTRIBUTION_DECLINED' end,
      case when new.status = 'ACCEPTED' then 'Contribution accepted' else 'Contribution update' end,
      case
        when new.status = 'ACCEPTED' then
          'Your contribution "' || new.title || '" was accepted' || coalesce(' on ' || project_name, '') || '.'
        else
          'Your contribution "' || new.title || '" was declined' || coalesce(' on ' || project_name, '') || '.'
      end,
      case when new.project_id is not null then '/build/' || new.project_id else '/build?tab=contributions' end
    );
  end if;
  return new;
end;
$$;

create trigger on_contribution_decided
  after update on public.contributions
  for each row execute function public.notify_contribution_decision();

-- ---------------------------------------------------------------------------
-- PROJECT_MEMBER_JOINED — someone joins a project you own.
-- ---------------------------------------------------------------------------
create or replace function public.notify_project_joined()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  proj record;
begin
  if new.status = 'ACTIVE' and new.role <> 'OWNER' then
    select owner_id, name into proj from public.projects where id = new.project_id;

    if proj.owner_id is not null and proj.owner_id <> new.profile_id then
      insert into public.notifications (profile_id, type, title, body, link)
      values (
        proj.owner_id,
        'PROJECT_MEMBER_JOINED',
        'New team member',
        (select coalesce(full_name, username, 'Someone') from public.profiles where id = new.profile_id)
          || ' joined "' || proj.name || '".',
        '/build/' || new.project_id
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger on_project_member_joined_notify
  after insert on public.project_members
  for each row execute function public.notify_project_joined();
