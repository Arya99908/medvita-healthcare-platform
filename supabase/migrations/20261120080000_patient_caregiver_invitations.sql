create table public.patient_invitations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  invited_email text not null,
  relationship_role text not null check (relationship_role in ('caregiver','family_member')),
  can_write boolean not null default false,
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (invited_email = lower(trim(invited_email)))
);

create index patient_invitations_patient_created_idx on public.patient_invitations(patient_id, created_at desc);
alter table public.patient_invitations enable row level security;
create policy "patients can review their own invitations" on public.patient_invitations
  for select to authenticated using (
    invited_by = auth.uid()
    and medvita_private.has_patient_access(patient_id, 'write')
  );

create or replace function public.create_patient_invitation(
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
  if p_relationship_role not in ('caregiver','family_member') then
    raise exception 'Unsupported relationship role' using errcode = '22023';
  end if;
  if exists (select 1 from auth.users u where u.id = caller_id and lower(u.email) = normalized_email) then
    raise exception 'You cannot invite your own account' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.patient_profiles p
    join public.patient_relationships r on r.patient_id = p.id
    where p.id = p_patient_id and p.life_stage in ('adult','senior')
      and r.user_id = caller_id and r.relationship_role = 'patient'
      and r.status = 'active' and r.can_write
  ) then
    raise exception 'Only an adult or senior patient can invite a caregiver' using errcode = '42501';
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
  values(caller_id, p_patient_id, 'caregiver_invitation_created', 'patient_invitation', new_invitation_id,
    jsonb_build_object('role', p_relationship_role, 'can_write', coalesce(p_can_write, false), 'expires_at', new_expiry));
  return query select new_invitation_id, new_token, new_expiry;
end;
$$;

create or replace function public.accept_patient_invitation(p_invitation_token text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := auth.uid();
  caller_email text;
  invitation public.patient_invitations%rowtype;
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
  if exists (select 1 from public.patient_relationships r where r.patient_id = invitation.patient_id and r.user_id = caller_id and r.status = 'active') then
    raise exception 'Your account already has access to this profile' using errcode = '23505';
  end if;

  insert into public.patient_relationships(patient_id, user_id, relationship_role, can_read, can_write, status, created_by)
  values(invitation.patient_id, caller_id, invitation.relationship_role, true, invitation.can_write, 'active', invitation.invited_by);
  update public.patient_invitations set accepted_at = now() where id = invitation.id;
  insert into public.audit_logs(actor_user_id, patient_id, action, resource_type, resource_id, metadata)
  values(caller_id, invitation.patient_id, 'caregiver_invitation_accepted', 'patient_invitation', invitation.id,
    jsonb_build_object('role', invitation.relationship_role, 'can_write', invitation.can_write));
  return invitation.patient_id;
end;
$$;

create or replace function public.revoke_patient_invitation(p_invitation_id uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := auth.uid();
  invitation public.patient_invitations%rowtype;
begin
  if caller_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into invitation from public.patient_invitations i where i.id = p_invitation_id for update;
  if not found or invitation.invited_by <> caller_id or invitation.accepted_at is not null or invitation.revoked_at is not null
    or invitation.expires_at <= now() or not medvita_private.has_patient_access(invitation.patient_id, 'write') then
    return false;
  end if;
  update public.patient_invitations set revoked_at = now() where id = invitation.id;
  insert into public.audit_logs(actor_user_id, patient_id, action, resource_type, resource_id)
  values(caller_id, invitation.patient_id, 'caregiver_invitation_revoked', 'patient_invitation', invitation.id);
  return true;
end;
$$;

revoke all on function public.create_patient_invitation(uuid,text,text,boolean) from public, anon;
revoke all on function public.accept_patient_invitation(text) from public, anon;
revoke all on function public.revoke_patient_invitation(uuid) from public, anon;
grant execute on function public.create_patient_invitation(uuid,text,text,boolean) to authenticated;
grant execute on function public.accept_patient_invitation(text) to authenticated;
grant execute on function public.revoke_patient_invitation(uuid) to authenticated;
