create or replace function medvita_private.record_patient_profile_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.patient_activity_events(
    patient_id,
    actor_user_id,
    action,
    resource_type,
    resource_id,
    visibility
  ) values (
    new.id,
    auth.uid(),
    'record_updated',
    'patient_profiles',
    new.id,
    'general'
  );
  return new;
end;
$$;

revoke all on function medvita_private.record_patient_profile_activity() from public, anon, authenticated;

create trigger record_patient_profile_activity
  after update of display_name, date_of_birth, sex_at_birth, preferred_language, life_stage
  on public.patient_profiles
  for each row
  when (
    old.display_name is distinct from new.display_name
    or old.date_of_birth is distinct from new.date_of_birth
    or old.sex_at_birth is distinct from new.sex_at_birth
    or old.preferred_language is distinct from new.preferred_language
    or old.life_stage is distinct from new.life_stage
  )
  execute function medvita_private.record_patient_profile_activity();
