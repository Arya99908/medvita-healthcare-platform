-- Structured child-care records use dedicated rows, not the generic wellness JSON.
create table public.urination_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  urination_type text not null check (urination_type in ('wet_diaper','toilet','other')),
  count smallint not null default 1 check (count between 1 and 100),
  volume_ml numeric check (volume_ml is null or volume_ml > 0),
  notes text check (notes is null or char_length(notes) <= 500),
  recorded_at timestamptz not null default now(),
  source text not null default 'caregiver' check (source in ('patient','caregiver','clinician','device','document_import')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','rejected')),
  visibility text not null default 'general' check (visibility in ('general','sensitive_adolescent')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.sleep_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  sleep_type text not null check (sleep_type in ('nap','overnight','other')),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  notes text check (notes is null or char_length(notes) <= 500),
  source text not null default 'caregiver' check (source in ('patient','caregiver','clinician','device','document_import')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','rejected')),
  visibility text not null default 'general' check (visibility in ('general','sensitive_adolescent')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ended_at > started_at)
);

create index urination_records_patient_date_idx on public.urination_records(patient_id,recorded_at desc);
create index sleep_records_patient_date_idx on public.sleep_records(patient_id,started_at desc);

alter table public.urination_records enable row level security;
alter table public.sleep_records enable row level security;
revoke all on public.urination_records, public.sleep_records from public, anon;
grant select, insert, update, delete on public.urination_records, public.sleep_records to authenticated;

create policy "linked readers can read child urination logs" on public.urination_records
  for select to authenticated using (
    medvita_private.has_patient_access(patient_id,'read')
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
    and (visibility<>'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
  );
create policy "linked writers can insert child urination logs" on public.urination_records
  for insert to authenticated with check (
    medvita_private.has_patient_access(patient_id,'write')
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
    and (visibility<>'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
    and (created_by is null or created_by=auth.uid())
  );
create policy "linked writers can update child urination logs" on public.urination_records
  for update to authenticated using (
    medvita_private.has_patient_access(patient_id,'write')
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
    and (visibility<>'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
  ) with check (
    medvita_private.has_patient_access(patient_id,'write')
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
    and (visibility<>'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
  );
create policy "linked writers can delete child urination logs" on public.urination_records
  for delete to authenticated using (
    medvita_private.has_patient_access(patient_id,'write')
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
  );

create policy "linked readers can read child sleep logs" on public.sleep_records
  for select to authenticated using (
    medvita_private.has_patient_access(patient_id,'read')
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
    and (visibility<>'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
  );
create policy "linked writers can insert child sleep logs" on public.sleep_records
  for insert to authenticated with check (
    medvita_private.has_patient_access(patient_id,'write')
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
    and (visibility<>'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
    and (created_by is null or created_by=auth.uid())
  );
create policy "linked writers can update child sleep logs" on public.sleep_records
  for update to authenticated using (
    medvita_private.has_patient_access(patient_id,'write')
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
    and (visibility<>'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
  ) with check (
    medvita_private.has_patient_access(patient_id,'write')
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
    and (visibility<>'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
  );
create policy "linked writers can delete child sleep logs" on public.sleep_records
  for delete to authenticated using (
    medvita_private.has_patient_access(patient_id,'write')
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
  );

-- Keep the export table list explicit so the RLS boundary is easy to audit.
create or replace function public.export_my_data()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'format_version', 1,
    'generated_at', statement_timestamp(),
    'account_id', auth.uid(),
    'tables', jsonb_build_object(
      'access_permissions', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.access_permissions r), '[]'::jsonb),
      'ai_analysis_sources', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.ai_analysis_sources r), '[]'::jsonb),
      'ai_reports', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.ai_reports r), '[]'::jsonb),
      'allergies', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.allergies r), '[]'::jsonb),
      'appointments', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.appointments r), '[]'::jsonb),
      'audit_logs', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.audit_logs r), '[]'::jsonb),
      'bowel_movement_records', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.bowel_movement_records r), '[]'::jsonb),
      'caregiver_handover_records', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.caregiver_handover_records r), '[]'::jsonb),
      'caregiver_tasks', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.caregiver_tasks r), '[]'::jsonb),
      'consent_records', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.consent_records r), '[]'::jsonb),
      'emergency_alerts', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.emergency_alerts r), '[]'::jsonb),
      'emergency_contacts', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.emergency_contacts r), '[]'::jsonb),
      'extracted_document_data', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.extracted_document_data r), '[]'::jsonb),
      'feeding_records', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.feeding_records r), '[]'::jsonb),
      'growth_records', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.growth_records r), '[]'::jsonb),
      'guardianships', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.guardianships r), '[]'::jsonb),
      'health_events', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.health_events r), '[]'::jsonb),
      'hospital_admissions', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.hospital_admissions r), '[]'::jsonb),
      'hospital_visits', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.hospital_visits r), '[]'::jsonb),
      'laboratory_results', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.laboratory_results r), '[]'::jsonb),
      'medical_conditions', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.medical_conditions r), '[]'::jsonb),
      'medical_documents', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.medical_documents r), '[]'::jsonb),
      'medication_administration_logs', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.medication_administration_logs r), '[]'::jsonb),
      'medication_records', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.medication_records r), '[]'::jsonb),
      'medication_schedules', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.medication_schedules r), '[]'::jsonb),
      'menstrual_records', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.menstrual_records r), '[]'::jsonb),
      'notification_preferences', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.notification_preferences r), '[]'::jsonb),
      'notifications', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.notifications r), '[]'::jsonb),
      'patient_profiles', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.patient_profiles r), '[]'::jsonb),
      'patient_relationships', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.patient_relationships r), '[]'::jsonb),
      'patient_sharing_sessions', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.patient_sharing_sessions r), '[]'::jsonb),
      'profiles', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.profiles r), '[]'::jsonb),
      'symptom_observations', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.symptom_observations r), '[]'::jsonb),
      'sleep_records', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.sleep_records r), '[]'::jsonb),
      'user_roles', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.user_roles r), '[]'::jsonb),
      'urination_records', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.urination_records r), '[]'::jsonb),
      'vitals', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.vitals r), '[]'::jsonb),
      'vomiting_records', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.vomiting_records r), '[]'::jsonb),
      'wellness_plans', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.wellness_plans r), '[]'::jsonb),
      'wellness_records', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.wellness_records r), '[]'::jsonb)
    )
  );
end;
$$;

revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
comment on function public.export_my_data() is
  'Returns an export of the authenticated caller’s RLS-visible MedVita data. Sharing token hashes are omitted.';
