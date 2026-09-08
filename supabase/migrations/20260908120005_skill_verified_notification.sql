-- Same shape of gap as the last two rounds: award_reputation_for_skill_verified
-- (see 20260908120001_reputation_triggers.sql) already fires when an admin
-- verifies a member's skill, but nobody ever told the member it happened.

create or replace function public.notify_skill_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  skill_name text;
begin
  if new.is_verified = true and old.is_verified is distinct from true then
    select name into skill_name from public.skills where id = new.skill_id;

    insert into public.notifications (profile_id, type, title, body, link)
    values (
      new.profile_id,
      'SKILL_VERIFIED',
      'Skill verified',
      'Your skill "' || coalesce(skill_name, 'skill') || '" was verified by an admin.',
      '/passport'
    );
  end if;
  return new;
end;
$$;

create trigger on_skill_verified_notify
  after update on public.profile_skills
  for each row execute function public.notify_skill_verified();
