-- ---------------------------------------------------------------------------
-- INVITE LINKS
-- ---------------------------------------------------------------------------
-- Until now the only way into Ollieen was to already know the URL and sign up
-- cold. That leaves a member with no way to bring someone specific in, and
-- leaves the new arrival landing on a generic page with no idea who sent them.
--
-- Each member gets ONE reusable personal link rather than a batch of
-- single-use codes: a founder recruiting by hand wants one link they can paste
-- into a DM, a bio or a group chat, and a link that says "already used" is a
-- dead end at exactly the moment someone was about to join.
--
-- Accepting a link does more than record where the signup came from — it
-- creates the connection immediately, so the new member arrives already
-- connected to someone instead of to an empty network.
-- ---------------------------------------------------------------------------

create table if not exists public.invites (
  code text primary key check (char_length(code) between 8 and 64),
  -- One link per member: unique, not just a plain reference.
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  accepted_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.invites enable row level security;

-- A member can see and create only their own link. There is deliberately no
-- policy for anon: a signed-out visitor never reads this table directly, only
-- through get_invite_preview() below, which returns two safe fields.
create policy "invites_select_own" on public.invites for select to authenticated
  using (profile_id = auth.uid());
create policy "invites_insert_own" on public.invites for insert to authenticated
  with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Get (or lazily create) the caller's own link.
-- ---------------------------------------------------------------------------
-- Codes are 16 hex characters — 64 bits from gen_random_uuid(), which is
-- already in use across this schema, so no extension dependency is added.
-- That is far beyond guessable, which matters because possessing a code is
-- what authorises the connection in redeem_invite() below.
create or replace function public.get_or_create_my_invite()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_attempt int := 0;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select code into v_code from public.invites where profile_id = auth.uid();
  if v_code is not null then
    return v_code;
  end if;

  -- Collision at 64 bits is vanishingly unlikely; retry anyway rather than
  -- surface an error to someone who just tapped "Invite".
  loop
    v_attempt := v_attempt + 1;
    v_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);
    begin
      insert into public.invites (code, profile_id) values (v_code, auth.uid());
      return v_code;
    exception
      when unique_violation then
        -- Another session created this member's row first — use theirs.
        select code into v_code from public.invites where profile_id = auth.uid();
        if v_code is not null then
          return v_code;
        end if;
        if v_attempt >= 5 then
          raise;
        end if;
    end;
  end loop;
end;
$$;

grant execute on function public.get_or_create_my_invite() to authenticated;

-- ---------------------------------------------------------------------------
-- Public preview of an invite, for the signed-out landing page.
-- ---------------------------------------------------------------------------
-- Returns the inviter's display name and avatar and nothing else — never an
-- email, an id, or any other profile field. Granted to anon because the whole
-- point is that someone who has not signed up yet can see who invited them.
create or replace function public.get_invite_preview(p_code text)
returns table (inviter_name text, inviter_avatar text)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(nullif(btrim(p.full_name), ''), nullif(btrim(p.username), ''), p.passport_id),
    p.avatar_url
  from public.invites i
  join public.profiles p on p.id = i.profile_id
  where i.code = p_code;
$$;

grant execute on function public.get_invite_preview(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Redeem an invite: connect the new member to whoever invited them.
-- ---------------------------------------------------------------------------
-- security definer for two reasons: the caller cannot read public.invites for
-- a code that is not theirs, and cannot increment another member's
-- accepted_count. The connection itself is inserted with requester_id =
-- auth.uid(), which the normal RLS policy would already allow.
--
-- It can only ever connect the caller to the owner of a code they hold, so
-- possessing the code is the authorisation. Returns false (never raises) when
-- the code is unknown, self-issued, or already redeemed by this member, so a
-- stale or mistyped code can never block someone finishing onboarding.
create or replace function public.redeem_invite(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inviter uuid;
  v_new_member uuid := auth.uid();
  v_name text;
  v_inserted boolean := false;
begin
  if v_new_member is null or p_code is null then
    return false;
  end if;

  select profile_id into v_inviter from public.invites where code = p_code;

  -- Unknown code, or someone opened their own link.
  if v_inviter is null or v_inviter = v_new_member then
    return false;
  end if;

  insert into public.connections (requester_id, addressee_id, status)
  values (v_new_member, v_inviter, 'ACCEPTED')
  on conflict (low_id, high_id) do nothing;

  v_inserted := found;

  -- Already connected (they had met some other way first): nothing further to
  -- record, and no second notification.
  if not v_inserted then
    return false;
  end if;

  update public.invites
     set accepted_count = accepted_count + 1
   where code = p_code;

  select coalesce(nullif(btrim(full_name), ''), nullif(btrim(username), ''), passport_id)
    into v_name
  from public.profiles where id = v_new_member;

  insert into public.notifications (profile_id, type, title, body, link)
  values (
    v_inviter,
    'INVITE_ACCEPTED',
    'Someone joined through your invite',
    v_name || ' created their Passport using your invite link. You are now connected.',
    '/passport/' || v_new_member::text
  );

  return true;
end;
$$;

grant execute on function public.redeem_invite(text) to authenticated;

-- ---------------------------------------------------------------------------
-- INVITE_ACCEPTED is worth an email.
-- ---------------------------------------------------------------------------
-- Someone you personally invited actually showing up is one of the few things
-- genuinely worth pulling a member back into the app, so it joins the
-- allowlist rather than staying in-app only.
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
    'VERIFICATION_REJECTED',
    'INVITE_ACCEPTED'
  );
$$;
