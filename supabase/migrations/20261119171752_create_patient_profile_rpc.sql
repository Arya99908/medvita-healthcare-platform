-- Atomically create an authenticated user's own patient profile and self relationship.
-- This function is SECURITY INVOKER: table RLS remains the authorization boundary.
create or replace function public.create_patient_profile(
  p_display_name text,
  p_life_stage text,
  p_date_of_birth date default null,
  p_preferred_language text default 'en',
  p_guardian_attested boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path=public,auth
as $$
declare
  new_patient_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if length(trim(coalesce(p_display_name,''))) < 2 or length(trim(p_display_name)) > 100 then
    raise exception 'Name must be between 2 and 100 characters' using errcode='22023';
  end if;
  if p_life_stage not in ('infant','child','adolescent','adult','senior') then
    raise exception 'Invalid life stage' using errcode='22023';
  end if;
  if p_date_of_birth is not null and p_date_of_birth > current_date then
    raise exception 'Date of birth cannot be in the future' using errcode='22023';
  end if;
  if p_life_stage in ('infant','child','adolescent') and not coalesce(p_guardian_attested,false) then
    raise exception 'Guardian attestation is required for a minor profile request' using errcode='42501';
  end if;

  insert into public.patient_profiles(created_by,display_name,date_of_birth,life_stage,preferred_language)
  values(auth.uid(),trim(p_display_name),p_date_of_birth,p_life_stage,coalesce(nullif(trim(p_preferred_language),''),'en'))
  returning id into new_patient_id;

  if p_life_stage in ('infant','child','adolescent') then
    insert into public.patient_relationships(patient_id,user_id,relationship_role,can_read,can_write,status,created_by)
    values(new_patient_id,auth.uid(),'guardian',false,false,'pending',auth.uid());
    insert into public.guardianships(patient_id,guardian_user_id,consent_status)
    values(new_patient_id,auth.uid(),'pending');
  else
    insert into public.patient_relationships(patient_id,user_id,relationship_role,can_read,can_write,status,created_by)
    values(new_patient_id,auth.uid(),'patient',true,true,'active',auth.uid());
  end if;

  return new_patient_id;
end;
$$;
drop policy "patient can create own relationship" on public.patient_relationships;
create policy "patient creates own active relationship" on public.patient_relationships for insert to authenticated
  with check(user_id=auth.uid() and relationship_role='patient' and status='active' and can_read and can_write and created_by=auth.uid()
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.created_by=auth.uid()));
create policy "creator can request pending guardian relationship" on public.patient_relationships for insert to authenticated
  with check(user_id=auth.uid() and relationship_role='guardian' and status='pending' and not can_read and not can_write and created_by=auth.uid()
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.created_by=auth.uid()));
drop policy "patient can create pending guardianship requests" on public.guardianships;
create policy "profile creator requests pending guardianship review" on public.guardianships for insert to authenticated
  with check(guardian_user_id=auth.uid() and consent_status='pending' and verified_by is null and verified_at is null
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.created_by=auth.uid()));

revoke all on function public.create_patient_profile(text,text,date,text,boolean) from public,anon;
grant execute on function public.create_patient_profile(text,text,date,text,boolean) to authenticated;
