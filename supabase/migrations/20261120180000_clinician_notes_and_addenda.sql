-- Doctors may append clinician-authored notes only when the patient consented
-- through the doctor invitation. This does not grant general record write access.
alter table public.access_permissions
  drop constraint access_permissions_permission_check,
  add constraint access_permissions_permission_check
    check (permission in ('read','write','manage_documents','manage_care','clinical_notes'));

create or replace function medvita_private.has_patient_access(target_patient uuid, requested_permission text default 'read')
returns boolean language sql stable security definer set search_path=public,auth as $$
  select exists (
    select 1 from public.patient_relationships r
    where r.patient_id=target_patient and r.user_id=auth.uid() and r.status='active'
      and case requested_permission
        when 'read' then r.can_read
        when 'clinical_notes' then r.can_read
        when 'write' then r.can_write
        when 'manage_documents' then r.can_write
        when 'manage_care' then r.can_write
        else false
      end
      and (r.relationship_role<>'doctor' or (
        exists (select 1 from public.doctors d where d.user_id=auth.uid() and d.verification_status='verified')
        and exists (
          select 1 from public.access_permissions ap where ap.patient_id=target_patient and ap.user_id=auth.uid()
            and ap.permission=requested_permission and ap.revoked_at is null and (ap.expires_at is null or ap.expires_at>now())
        )
      ))
  );
$$;

create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  doctor_user_id uuid not null references auth.users(id) on delete restrict,
  note_kind text not null check(note_kind in ('consultation','treatment_plan','follow_up','addendum')),
  title text not null check(length(trim(title)) between 2 and 160),
  body text not null check(length(trim(body)) between 1 and 8000),
  follow_up_on date,
  amends_note_id uuid references public.clinical_notes(id) on delete restrict,
  created_at timestamptz not null default now(),
  check ((note_kind = 'addendum') = (amends_note_id is not null))
);
create index clinical_notes_patient_created_idx on public.clinical_notes(patient_id,created_at desc);
alter table public.clinical_notes enable row level security;
revoke all on public.clinical_notes from anon, authenticated;
grant select,insert on public.clinical_notes to authenticated;
create policy "linked readers can read clinician notes" on public.clinical_notes
  for select to authenticated using(medvita_private.has_patient_access(patient_id,'read'));
create policy "consented verified doctor can append clinician notes" on public.clinical_notes
  for insert to authenticated with check(
    doctor_user_id=auth.uid()
    and medvita_private.has_patient_access(patient_id,'clinical_notes')
    and exists(select 1 from public.doctors d where d.user_id=auth.uid() and d.verification_status='verified')
    and (amends_note_id is null or exists(
      select 1 from public.clinical_notes previous
      where previous.id=clinical_notes.amends_note_id and previous.patient_id=clinical_notes.patient_id
    ))
  );
create trigger record_clinical_note_activity after insert on public.clinical_notes
  for each row execute function medvita_private.record_patient_activity();

-- An accepted verified-doctor invitation grants a separate, time-limited note
-- permission in addition to read consent. Revoking the relationship revokes both.
create or replace function medvita_private.accept_patient_invitation(p_invitation_token text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := auth.uid();
  caller_email text;
  invitation public.patient_invitations%rowtype;
  patient_permission_expires timestamptz;
begin
  if caller_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select lower(u.email) into caller_email from auth.users u where u.id = caller_id and u.email_confirmed_at is not null;
  if caller_email is null then raise exception 'Confirm your account email before accepting an invitation' using errcode = '42501'; end if;
  if p_invitation_token is null or length(p_invitation_token) <> 64 then
    raise exception 'This invitation is invalid or expired' using errcode = '22023';
  end if;
  select * into invitation from public.patient_invitations i
  where i.token_hash = encode(extensions.digest(p_invitation_token, 'sha256'), 'hex')
  for update;
  if not found or invitation.expires_at <= now() or invitation.revoked_at is not null or invitation.accepted_at is not null then
    raise exception 'This invitation is invalid, expired, or already used' using errcode = '22023';
  end if;
  if invitation.invited_email <> caller_email then
    raise exception 'Sign in with the email address this invitation was sent to' using errcode = '42501';
  end if;
  if invitation.relationship_role = 'doctor' and not exists (
    select 1 from public.doctors d where d.user_id = caller_id and d.verification_status = 'verified'
  ) then
    raise exception 'A verified doctor profile is required to accept this invitation' using errcode = '42501';
  end if;
  if exists (select 1 from public.patient_relationships r where r.patient_id = invitation.patient_id and r.user_id = caller_id and r.relationship_role = invitation.relationship_role and r.status = 'active') then
    raise exception 'Your account already has access to this profile' using errcode = '23505';
  end if;

  insert into public.patient_relationships(patient_id, user_id, relationship_role, can_read, can_write, status, created_by, revoked_at)
  values(invitation.patient_id, caller_id, invitation.relationship_role, true, invitation.can_write, 'active', invitation.invited_by, null)
  on conflict (patient_id, user_id, relationship_role) do update
    set can_read = excluded.can_read, can_write = excluded.can_write, status = 'active', created_by = excluded.created_by, revoked_at = null;

  if invitation.relationship_role = 'doctor' then
    patient_permission_expires := now() + interval '90 days';
    insert into public.access_permissions(patient_id, user_id, permission, granted_by, expires_at, revoked_at)
    values
      (invitation.patient_id, caller_id, 'read', invitation.invited_by, patient_permission_expires, null),
      (invitation.patient_id, caller_id, 'clinical_notes', invitation.invited_by, patient_permission_expires, null)
    on conflict (patient_id, user_id, permission) do update
      set granted_by = excluded.granted_by, expires_at = excluded.expires_at, revoked_at = null;
  end if;

  update public.patient_invitations set accepted_at = now() where id = invitation.id;
  insert into public.audit_logs(actor_user_id, patient_id, action, resource_type, resource_id, metadata)
  values(caller_id, invitation.patient_id, case when invitation.relationship_role = 'doctor' then 'doctor_invitation_accepted' else 'caregiver_invitation_accepted' end, 'patient_invitation', invitation.id,
    jsonb_build_object('role', invitation.relationship_role, 'can_write', invitation.can_write,
      'permission_expires_at', patient_permission_expires));
  return invitation.patient_id;
end;
$$;

create or replace function medvita_private.revoke_doctor_read_consent()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if pg_trigger_depth() = 0 then
    raise exception 'This function is only available to its trigger' using errcode = '42501';
  end if;
  if new.relationship_role = 'doctor' and old.status = 'active' and new.status = 'revoked' then
    update public.access_permissions
      set revoked_at = coalesce(new.revoked_at, now())
      where patient_id = new.patient_id and user_id = new.user_id
        and permission in ('read','clinical_notes') and revoked_at is null;
  end if;
  return new;
end;
$$;

-- Preserve the full explicit account export and append the new RLS-visible table.
alter function public.export_my_data() set schema medvita_private;
alter function medvita_private.export_my_data() rename to export_my_data_base;
create function public.export_my_data()
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  exported jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  exported := medvita_private.export_my_data_base();
  return jsonb_set(exported, '{tables}', (exported->'tables') || jsonb_build_object(
    'clinical_notes', coalesce((select jsonb_agg(to_jsonb(r)) from public.clinical_notes r), '[]'::jsonb)
  ), true);
end;
$$;
revoke all on function medvita_private.export_my_data_base() from public, anon;
grant execute on function medvita_private.export_my_data_base() to authenticated;
revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
comment on function public.export_my_data() is
  'Returns an export of the authenticated caller’s RLS-visible MedVita data including clinician notes. Sharing token hashes are omitted.';
