-- A verified, auditable request queue. Requests do not delete accounts or health records.
-- Actual deletion is intentionally deferred until linked-record retention rules are approved.
create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  reauthenticated_at timestamptz not null,
  status text not null default 'requested' check (status in ('requested','withdrawn','ready_for_manual_processing','retention_review','declined')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (review_note is null or char_length(review_note) <= 500),
  constraint account_deletion_requests_review_state_check check (
    (status in ('requested','withdrawn') and reviewed_by is null and reviewed_at is null)
    or (status in ('ready_for_manual_processing','retention_review','declined') and reviewed_by is not null and reviewed_at is not null)
  )
);

create unique index account_deletion_requests_one_open_per_user_idx
  on public.account_deletion_requests(user_id) where status='requested' and user_id is not null;
create index account_deletion_requests_queue_idx
  on public.account_deletion_requests(status,requested_at) where status='requested';

alter table public.account_deletion_requests enable row level security;
revoke all on public.account_deletion_requests from public, anon, authenticated;
grant select, insert, update(status) on public.account_deletion_requests to authenticated;

create policy "users read own deletion requests and admins read queue"
  on public.account_deletion_requests for select to authenticated using (
    user_id=auth.uid()
    or exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.role='platform_admin')
  );
create policy "users request own account deletion"
  on public.account_deletion_requests for insert to authenticated with check (
    user_id=auth.uid() and status='requested' and reviewed_by is null and reviewed_at is null
  );
create policy "users withdraw own pending deletion request"
  on public.account_deletion_requests for update to authenticated using (
    user_id=auth.uid() and status='requested'
  ) with check (
    user_id=auth.uid() and status='withdrawn' and reviewed_by is null and reviewed_at is null
  );

create or replace function public.log_account_deletion_request_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,metadata)
  values (
    auth.uid(),
    case when tg_op='INSERT' then 'account_deletion_requested'
      when new.status='withdrawn' then 'account_deletion_request_withdrawn'
      else 'account_deletion_request_reviewed' end,
    'account_deletion_request',
    new.id,
    jsonb_build_object('status',new.status)
  );
  return new;
end;
$$;

create trigger account_deletion_request_audit
  after insert or update of status on public.account_deletion_requests
  for each row execute function public.log_account_deletion_request_change();

create policy "platform admins read account deletion request audit"
  on public.audit_logs for select to authenticated using (
    resource_type='account_deletion_request'
    and exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.role='platform_admin')
  );

create or replace function public.review_account_deletion_request(
  p_request_id uuid,
  p_decision text,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or not exists(
    select 1 from public.user_roles ur where ur.user_id=actor and ur.role='platform_admin'
  ) then
    raise exception 'Platform administrator role required' using errcode='42501';
  end if;
  if p_decision not in ('ready_for_manual_processing','retention_review','declined')
    or p_note is null or char_length(btrim(p_note)) < 5 or char_length(p_note) > 500 then
    raise exception 'Choose a valid review outcome and add a short explanation' using errcode='22023';
  end if;
  update public.account_deletion_requests
    set status=p_decision, reviewed_by=actor, reviewed_at=now(), review_note=btrim(p_note)
    where id=p_request_id and status='requested';
  if not found then
    raise exception 'Request not found or already reviewed' using errcode='P0002';
  end if;
end;
$$;
revoke all on function public.review_account_deletion_request(uuid,text,text) from public, anon;
grant execute on function public.review_account_deletion_request(uuid,text,text) to authenticated;

-- Keep account deletion request metadata in the caller's existing RLS-filtered data export.
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
      'account_deletion_requests', coalesce((select jsonb_agg(to_jsonb(r)) from public.account_deletion_requests r), '[]'::jsonb),
      'ai_analysis_sources', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.ai_analysis_sources r), '[]'::jsonb),
      'ai_report_reviews', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.ai_report_reviews r), '[]'::jsonb),
      'ai_reports', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.ai_reports r), '[]'::jsonb),
      'allergies', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.allergies r), '[]'::jsonb),
      'appointments', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.appointments r), '[]'::jsonb),
      'audit_logs', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.audit_logs r), '[]'::jsonb),
      'bowel_movement_records', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.bowel_movement_records r), '[]'::jsonb),
      'caregiver_handover_records', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.caregiver_handover_records r), '[]'::jsonb),
      'caregiver_tasks', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.caregiver_tasks r), '[]'::jsonb),
      'clinical_notes', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.clinical_notes r), '[]'::jsonb),
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
      'patient_invitations', coalesce((select jsonb_agg(to_jsonb(r) - 'token_hash') from public.patient_invitations r), '[]'::jsonb),
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

comment on table public.account_deletion_requests is
  'Auditable account-deletion requests. No status in this table deletes an account or health data; manual processing requires approved retention rules.';
