-- Store caregiver-entered milestone observations without supplying clinical milestones or age norms.
create table public.developmental_milestones (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  milestone_name text not null check (char_length(btrim(milestone_name)) between 2 and 100),
  domain text not null check (domain in ('motor','communication','cognitive','social_emotional','self_care','other')),
  status text not null check (status in ('observed','not_observed','follow_up')),
  recorded_on date not null default current_date,
  follow_up_on date,
  notes text check (notes is null or char_length(notes) <= 500),
  source text not null default 'caregiver' check (source in ('patient','caregiver','clinician','device','document_import')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','rejected')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint developmental_milestones_follow_up_date_check check (status <> 'follow_up' or follow_up_on is not null)
);

create index developmental_milestones_patient_follow_up_idx on public.developmental_milestones(patient_id,follow_up_on asc);
alter table public.developmental_milestones enable row level security;
revoke all on public.developmental_milestones from public, anon;
grant select, insert, update, delete on public.developmental_milestones to authenticated;

create policy "linked readers can read child milestones" on public.developmental_milestones
  for select to authenticated using (
    medvita_private.has_patient_access(patient_id,'read')
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
  );
create policy "linked writers can insert child milestones" on public.developmental_milestones
  for insert to authenticated with check (
    medvita_private.has_patient_access(patient_id,'write')
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
    and (created_by is null or created_by=auth.uid())
  );
create policy "linked writers can update child milestones" on public.developmental_milestones
  for update to authenticated using (
    medvita_private.has_patient_access(patient_id,'write')
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
  ) with check (
    medvita_private.has_patient_access(patient_id,'write')
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
  );
create policy "linked writers can delete child milestones" on public.developmental_milestones
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
      'developmental_milestones', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.developmental_milestones r), '[]'::jsonb),
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
      'vaccination_records', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.vaccination_records r), '[]'::jsonb),
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
