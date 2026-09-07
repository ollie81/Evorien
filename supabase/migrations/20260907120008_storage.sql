-- Storage buckets. Avatars are public (they're meant to be shown everywhere);
-- verification evidence is private and only visible to its owner and admins —
-- per the product rule that sensitive verification documents are never
-- exposed publicly.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('verification-evidence', 'verification-evidence', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('project-media', 'project-media', true)
on conflict (id) do nothing;

-- Convention: every uploaded object's path is prefixed with the uploader's
-- own auth.uid(), e.g. "avatars/<uid>/profile.jpg". That prefix is what these
-- policies check via storage.foldername(name).

create policy "avatars_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars');

create policy "avatars_owner_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "project_media_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'project-media');

create policy "project_media_team_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'project-media'
    and public.is_project_team(((storage.foldername(name))[1])::uuid)
  );

create policy "project_media_team_manage" on storage.objects
  for update to authenticated
  using (bucket_id = 'project-media' and public.is_project_team(((storage.foldername(name))[1])::uuid))
  with check (bucket_id = 'project-media' and public.is_project_team(((storage.foldername(name))[1])::uuid));

create policy "project_media_team_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-media' and public.is_project_team(((storage.foldername(name))[1])::uuid));

-- Verification evidence: never public. Owner can upload/read their own;
-- admins can read everything to review requests; nobody can overwrite or
-- delete evidence once submitted (keeps the review trail honest).
create policy "verification_evidence_owner_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'verification-evidence' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "verification_evidence_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'verification-evidence'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
