create table public.patient_activity_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  visibility text not null default 'general' check (visibility in ('general','sensitive_adolescent')),
  occurred_at timestamptz not null default now()
);

create index patient_activity_events_patient_occurred_idx
  on public.patient_activity_events(patient_id, occurred_at desc);

alter table public.patient_activity_events enable row level security;
revoke all on public.patient_activity_events from anon, authenticated;
grant select on public.patient_activity_events to authenticated;

create policy "linked readers can read permitted activity"
on public.patient_activity_events for select to authenticated
using (
  medvita_private.has_patient_access(patient_id, 'read')
  and (visibility = 'general' or medvita_private.has_sensitive_access(patient_id))
);

create or replace function medvita_private.record_patient_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb;
  prior_data jsonb;
  target_patient uuid;
  target_actor uuid;
  target_visibility text;
  target_action text;
  target_id uuid;
begin
  if tg_op = 'DELETE' then
    row_data := to_jsonb(old);
    prior_data := row_data;
  else
    row_data := to_jsonb(new);
    if tg_op = 'UPDATE' then prior_data := to_jsonb(old); end if;
  end if;

  -- Avoid recording updates that only refresh bookkeeping timestamps.
  if tg_op = 'UPDATE'
     and (row_data - 'updated_at' - 'last_updated_at') is not distinct from (prior_data - 'updated_at' - 'last_updated_at') then
    return new;
  end if;

  target_patient := nullif(row_data->>'patient_id', '')::uuid;
  target_actor := coalesce(
    auth.uid(),
    nullif(row_data->>'created_by', '')::uuid,
    nullif(row_data->>'recorded_by', '')::uuid,
    nullif(row_data->>'uploaded_by', '')::uuid,
    nullif(row_data->>'from_user_id', '')::uuid
  );
  target_id := nullif(row_data->>'id', '')::uuid;
  target_visibility := case
    when row_data->>'visibility' = 'sensitive_adolescent' then 'sensitive_adolescent'
    else 'general'
  end;

  if tg_op = 'INSERT' then
    target_action := case
      when tg_table_name = 'caregiver_tasks' then 'care_task_created'
      when tg_table_name = 'medication_administration_logs' then 'dose_event_recorded'
      when tg_table_name = 'caregiver_handover_records' then 'handover_recorded'
      else 'record_added'
    end;
  elsif tg_op = 'DELETE' then
    target_action := 'record_removed';
  elsif tg_table_name = 'caregiver_tasks' and row_data->>'status' is distinct from prior_data->>'status' then
    target_action := case row_data->>'status'
      when 'complete' then 'care_task_completed'
      when 'missed' then 'care_task_missed'
      when 'cancelled' then 'care_task_cancelled'
      else 'care_task_reopened'
    end;
  elsif tg_table_name = 'appointments' and row_data->>'status' is distinct from prior_data->>'status' then
    target_action := 'appointment_status_changed';
  else
    target_action := 'record_updated';
  end if;

  insert into public.patient_activity_events(patient_id, actor_user_id, action, resource_type, resource_id, visibility)
  values (target_patient, target_actor, target_action, tg_table_name, target_id, target_visibility);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function medvita_private.record_patient_activity() from public, anon, authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'health_events', 'symptom_observations', 'medical_conditions', 'allergies', 'vitals',
    'feeding_records', 'bowel_movement_records', 'vomiting_records', 'growth_records',
    'urination_records', 'sleep_records', 'vaccination_records', 'developmental_milestones',
    'menstrual_records', 'medication_records', 'medication_schedules',
    'medication_administration_logs', 'medical_documents', 'appointments',
    'caregiver_tasks', 'caregiver_handover_records', 'wellness_plans', 'wellness_records',
    'emergency_alerts'
  ] loop
    execute format('create trigger record_patient_activity after insert or update or delete on public.%I for each row execute function medvita_private.record_patient_activity()', table_name);
  end loop;
end;
$$;
