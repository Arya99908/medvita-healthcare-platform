-- Extend patient-controlled, email-bound invitations to verified clinicians.
-- A clinician receives read-only access that expires after 90 days; the patient
-- can revoke it earlier by revoking the relationship.
alter table public.patient_invitations
  drop constraint patient_invitations_relationship_role_check,
  add constraint patient_invitations_relationship_role_check
    check (relationship_role in ('caregiver','family_member','doctor'));


create or replace function medvita_private.create_patient_invitation(
  p_patient_id uuid,
  p_invited_email text,
  p_relationship_role text,
  p_can_write boolean default false
)
returns table(invitation_id uuid, invitation_token text, invitation_expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := auth.uid();
  normalized_email text := lower(trim(coalesce(p_invited_email, '')));
  new_token text := encode(extensions.gen_random_bytes(32), 'hex');
  new_invitation_id uuid;
  new_expiry timestamptz := now() + interval '7 days';
begin
  if caller_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid email address' using errcode = '22023';
  end if;
  if p_relationship_role not in ('caregiver','family_member','doctor') then
    raise exception 'Unsupported relationship role' using errcode = '22023';
  end if;
  if p_relationship_role = 'doctor' and coalesce(p_can_write, false) then
    raise exception 'Doctor invitations are read-only' using errcode = '22023';
  end if;
  if exists (select 1 from auth.users u where u.id = caller_id and lower(u.email) = normalized_email) then
    raise exception 'You cannot invite your own account' using errcode = '22023';
  end if;
  if p_relationship_role = 'doctor' and not exists (
    select 1 from auth.users u join public.doctors d on d.user_id = u.id
    where lower(u.email) = normalized_email and u.email_confirmed_at is not null
      and d.verification_status = 'verified'
  ) then
    raise exception 'A verified doctor account with this confirmed email is required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.patient_profiles p
    join public.patient_relationships r on r.patient_id = p.id
    where p.id = p_patient_id and p.life_stage in ('adult','senior')
      and r.user_id = caller_id and r.relationship_role = 'patient'
      and r.status = 'active' and r.can_write
  ) then
    raise exception 'Only an adult or senior patient can invite a care partner' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.patient_invitations i where i.patient_id = p_patient_id
      and i.invited_email = normalized_email and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()
  ) then
    raise exception 'An active invitation already exists for this email' using errcode = '23505';
  end if;
  if (select count(*) from public.patient_invitations i where i.patient_id = p_patient_id
      and i.invited_by = caller_id and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()) >= 10 then
    raise exception 'Revoke an unused invitation before creating another' using errcode = '23514';
  end if;

  insert into public.patient_invitations(patient_id, invited_email, relationship_role, can_write, token_hash, invited_by, expires_at)
  values(p_patient_id, normalized_email, p_relationship_role, coalesce(p_can_write, false), encode(extensions.digest(new_token, 'sha256'), 'hex'), caller_id, new_expiry)
  returning id into new_invitation_id;
  insert into public.audit_logs(actor_user_id, patient_id, action, resource_type, resource_id, metadata)
  values(caller_id, p_patient_id, case when p_relationship_role = 'doctor' then 'doctor_invitation_created' else 'caregiver_invitation_created' end, 'patient_invitation', new_invitation_id,
    jsonb_build_object('role', p_relationship_role, 'can_write', coalesce(p_can_write, false), 'expires_at', new_expiry));
  return query select new_invitation_id, new_token, new_expiry;
end;
$$;

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
    values(invitation.patient_id, caller_id, 'read', invitation.invited_by, patient_permission_expires, null)
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
        and permission = 'read' and revoked_at is null;
  end if;
  return new;
end;
$$;
revoke all on function medvita_private.revoke_doctor_read_consent() from public, anon;
grant execute on function medvita_private.revoke_doctor_read_consent() to authenticated;
create trigger revoke_doctor_read_consent_after_relationship
  after update of status on public.patient_relationships
  for each row execute function medvita_private.revoke_doctor_read_consent();
