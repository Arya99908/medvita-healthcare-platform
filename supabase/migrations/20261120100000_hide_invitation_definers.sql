-- Keep SECURITY DEFINER implementations out of PostgREST's exposed public schema.
alter function public.create_patient_invitation(uuid,text,text,boolean) set schema medvita_private;
alter function public.accept_patient_invitation(text) set schema medvita_private;
alter function public.revoke_patient_invitation(uuid) set schema medvita_private;

create function public.create_patient_invitation(
  p_patient_id uuid,
  p_invited_email text,
  p_relationship_role text,
  p_can_write boolean default false
)
returns table(invitation_id uuid, invitation_token text, invitation_expires_at timestamptz)
language sql security invoker set search_path = '' as $$
  select * from medvita_private.create_patient_invitation($1, $2, $3, $4);
$$;

create function public.accept_patient_invitation(p_invitation_token text)
returns uuid
language sql security invoker set search_path = '' as $$
  select medvita_private.accept_patient_invitation($1);
$$;

create function public.revoke_patient_invitation(p_invitation_id uuid)
returns boolean
language sql security invoker set search_path = '' as $$
  select medvita_private.revoke_patient_invitation($1);
$$;

revoke all on function public.create_patient_invitation(uuid,text,text,boolean) from public, anon;
revoke all on function public.accept_patient_invitation(text) from public, anon;
revoke all on function public.revoke_patient_invitation(uuid) from public, anon;
grant execute on function public.create_patient_invitation(uuid,text,text,boolean) to authenticated;
grant execute on function public.accept_patient_invitation(text) to authenticated;
grant execute on function public.revoke_patient_invitation(uuid) to authenticated;
