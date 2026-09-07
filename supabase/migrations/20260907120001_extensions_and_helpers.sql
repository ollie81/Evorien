-- Evorien database foundation: extensions and shared helper functions.
-- These are used by every table migration that follows.

create extension if not exists pgcrypto;

-- Generic "touch updated_at" trigger, reused by every table that has one.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Sets updated_at = now() on any UPDATE. Attach as a BEFORE UPDATE trigger.';
