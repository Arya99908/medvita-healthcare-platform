-- Export only records visible to the caller. This function deliberately runs
-- with invoker privileges so the existing table grants and RLS policies apply.
create or replace function public.export_my_data()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  table_name text;
  table_rows jsonb;
  exported_tables jsonb := '{}'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  -- This allow-list excludes shared hospital and doctor directories. New data
  -- tables are not exported until deliberately added here.
  foreach table_name in array array[
    'access_permissions', 'ai_analysis_sources', 'ai_reports', 'allergies',
    'appointments', 'audit_logs', 'bowel_movement_records',
    'caregiver_handover_records', 'caregiver_tasks', 'consent_records',
    'emergency_alerts', 'emergency_contacts', 'extracted_document_data',
    'feeding_records', 'growth_records', 'guardianships', 'health_events',
    'hospital_admissions', 'hospital_visits', 'laboratory_results',
    'medical_conditions', 'medical_documents', 'medication_administration_logs',
    'medication_records', 'medication_schedules', 'menstrual_records',
    'notification_preferences', 'notifications', 'patient_profiles',
    'patient_relationships', 'patient_sharing_sessions', 'profiles',
    'symptom_observations', 'user_roles', 'vitals', 'vomiting_records',
    'wellness_plans', 'wellness_records'
  ] loop
    execute format(
      'select coalesce(jsonb_agg(to_jsonb(row_data) - %L), ''[]''::jsonb) from public.%I as row_data',
      'token_hash', table_name
    ) into table_rows;
    exported_tables := exported_tables || jsonb_build_object(table_name, table_rows);
  end loop;

  return jsonb_build_object(
    'format_version', 1,
    'generated_at', statement_timestamp(),
    'account_id', auth.uid(),
    'tables', exported_tables
  );
end;
$$;

revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
comment on function public.export_my_data() is
  'Returns an export of the authenticated caller’s RLS-visible MedVita data. Sharing token hashes are omitted.';
