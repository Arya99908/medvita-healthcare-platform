-- Core MedVita schema. Apply only to a dedicated MedVita Supabase project.
-- Synthetic presentation profiles remain client-side and are not seeded into patient tables.
create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '', preferred_language text not null default 'en',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check(role in ('patient','guardian','family_member','caregiver','nurse','doctor','clinic_admin','platform_admin')),
  granted_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), unique(user_id,role)
);
create table public.patient_profiles (
  id uuid primary key default gen_random_uuid(), created_by uuid not null references auth.users(id) on delete restrict,
  display_name text not null, date_of_birth date,
  life_stage text not null check(life_stage in ('infant','child','adolescent','adult','senior')),
  sex_at_birth text check(sex_at_birth is null or sex_at_birth in ('female','male','intersex','not_shared')),
  preferred_language text not null default 'en', is_demo boolean not null default false,
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.patient_relationships (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  relationship_role text not null check(relationship_role in ('patient','guardian','family_member','caregiver','nurse','doctor','clinic_admin')),
  can_read boolean not null default true, can_write boolean not null default false,
  status text not null default 'active' check(status in ('pending','active','revoked')),
  created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now(), revoked_at timestamptz,
  unique(patient_id,user_id,relationship_role)
);
create table public.guardianships (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  guardian_user_id uuid not null references auth.users(id) on delete cascade,
  consent_status text not null default 'pending' check(consent_status in ('pending','verified','revoked')),
  evidence_reference text, verified_by uuid references auth.users(id) on delete set null, verified_at timestamptz,
  created_at timestamptz not null default now(), unique(patient_id,guardian_user_id)
);
create table public.consent_records (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  granted_by uuid not null references auth.users(id) on delete restrict, granted_to uuid references auth.users(id) on delete cascade,
  scope text not null check(scope in ('general','sensitive_adolescent','documents','care_coordination','ai_summary')),
  purpose text not null, status text not null default 'active' check(status in ('active','revoked','expired')),
  starts_at timestamptz not null default now(), expires_at timestamptz, revoked_at timestamptz, created_at timestamptz not null default now()
);
create table public.access_permissions (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  permission text not null check(permission in ('read','write','manage_documents','manage_care')),
  granted_by uuid not null references auth.users(id) on delete restrict, expires_at timestamptz, revoked_at timestamptz,
  created_at timestamptz not null default now(), unique(patient_id,user_id,permission)
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_user_id uuid references auth.users(id) on delete set null,
  patient_id uuid references public.patient_profiles(id) on delete set null, action text not null,
  resource_type text not null, resource_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create table public.medical_conditions (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  name text not null, status text not null default 'active' check(status in ('active','resolved','historical')),
  reported_by text not null default 'patient' check(reported_by in ('patient','caregiver','clinician','imported')),
  verification_status text not null default 'unverified' check(verification_status in ('unverified','verified','rejected')),
  diagnosed_on date, notes text, created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.allergies (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  substance text not null, reaction text, severity text check(severity is null or severity in ('mild','moderate','severe','unknown')),
  verification_status text not null default 'unverified' check(verification_status in ('unverified','verified','rejected')),
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.health_events (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  event_type text not null, title text not null, description text,
  source text not null default 'patient' check(source in ('patient','caregiver','clinician','document_import','ai_generated')),
  verification_status text not null default 'unverified' check(verification_status in ('unverified','verified','rejected')),
  visibility text not null default 'general' check(visibility in ('general','sensitive_adolescent')),
  occurred_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.vitals (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  vital_type text not null check(vital_type in ('blood_pressure_systolic','blood_pressure_diastolic','blood_glucose','weight','height','temperature','heart_rate','oxygen_saturation','head_circumference')),
  value numeric not null, unit text not null, source text not null default 'patient' check(source in ('patient','caregiver','clinician','device','document_import')),
  verification_status text not null default 'unverified' check(verification_status in ('unverified','verified','rejected')),
  measured_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table public.symptom_observations (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  symptom text not null, severity smallint check(severity between 1 and 5), notes text,
  visibility text not null default 'general' check(visibility in ('general','sensitive_adolescent')),
  observed_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table public.feeding_records (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  feeding_type text not null check(feeding_type in ('breastfeeding','formula','solid_food','other')),
  quantity_ml numeric check(quantity_ml is null or quantity_ml>=0), duration_minutes integer check(duration_minutes is null or duration_minutes>=0), notes text,
  recorded_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table public.bowel_movement_records (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  consistency text, color text, notes text, recorded_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table public.vomiting_records (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  count integer not null default 1 check(count>0), associated_notes text, recorded_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table public.growth_records (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  weight_kg numeric check(weight_kg is null or weight_kg>0), height_cm numeric check(height_cm is null or height_cm>0),
  head_circumference_cm numeric check(head_circumference_cm is null or head_circumference_cm>0), measured_at timestamptz not null default now(),
  source text not null default 'caregiver' check(source in ('patient','caregiver','clinician','document_import')),
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table public.menstrual_records (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  period_start date, period_end date, flow_note text, symptom_note text,
  visibility text not null default 'sensitive_adolescent' check(visibility='sensitive_adolescent'),
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.medication_records (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  medicine_name text not null, generic_name text, strength text, route text, instructions text,
  status text not null default 'active' check(status in ('active','paused','discontinued','historical')),
  prescribed_by uuid references auth.users(id) on delete set null, prescription_document_id uuid,
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.medication_schedules (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  medication_id uuid not null references public.medication_records(id) on delete cascade,
  frequency text not null, administration_times jsonb not null default '[]'::jsonb, starts_on date, ends_on date,
  reminder_enabled boolean not null default false, status text not null default 'active' check(status in ('active','paused','complete')),
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.medication_administration_logs (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  medication_id uuid not null references public.medication_records(id) on delete cascade, schedule_id uuid references public.medication_schedules(id) on delete set null,
  status text not null check(status in ('taken','missed','skipped','uncertain')), administered_at timestamptz not null default now(),
  recorded_by uuid references auth.users(id) on delete set null, notes text, created_at timestamptz not null default now()
);
create table public.medical_documents (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  storage_path text not null, document_type text not null, display_name text not null, document_date date,
  upload_status text not null default 'pending' check(upload_status in ('pending','uploaded','failed','deleted')),
  verification_status text not null default 'unverified' check(verification_status in ('unverified','verified','rejected')),
  uploaded_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.extracted_document_data (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  document_id uuid not null references public.medical_documents(id) on delete cascade, extracted_fields jsonb not null default '{}'::jsonb,
  review_status text not null default 'pending' check(review_status in ('pending','accepted','rejected')),
  reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz, created_at timestamptz not null default now()
);
create table public.laboratory_results (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  document_id uuid references public.medical_documents(id) on delete set null, test_name text not null, value_text text, unit text,
  reference_range text, result_date date,
  verification_status text not null default 'unverified' check(verification_status in ('unverified','verified','rejected')),
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table public.doctors (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null,
  display_name text not null, specialty text, organisation text,
  verification_status text not null default 'unverified' check(verification_status in ('unverified','pending','verified','rejected')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.hospitals (
  id uuid primary key default gen_random_uuid(), display_name text not null, address text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Create a minimal app profile and patient role alongside each confirmed auth user.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,display_name)
    values(new.id,coalesce(new.raw_user_meta_data->>'display_name','')) on conflict(id) do nothing;
  insert into public.user_roles(user_id,role) values(new.id,'patient') on conflict(user_id,role) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_auth_user();
create table public.hospital_visits (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  hospital_id uuid references public.hospitals(id) on delete set null, doctor_id uuid references public.doctors(id) on delete set null,
  visit_date timestamptz not null, visit_type text, notes text, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table public.hospital_admissions (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  hospital_id uuid references public.hospitals(id) on delete set null, admitted_at timestamptz not null, discharged_at timestamptz,
  summary text, discharge_document_id uuid references public.medical_documents(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table public.appointments (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null, title text not null, starts_at timestamptz not null, ends_at timestamptz,
  location text, status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled','missed')),
  source text not null default 'patient' check(source in ('patient','caregiver','clinician','imported')),
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.caregiver_tasks (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null, title text not null, due_at timestamptz,
  status text not null default 'open' check(status in ('open','complete','cancelled')), notes text,
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.caregiver_handover_records (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  from_user_id uuid references auth.users(id) on delete set null, to_user_id uuid references auth.users(id) on delete set null,
  handover_text text not null, visibility text not null default 'general' check(visibility in ('general','sensitive_adolescent')), created_at timestamptz not null default now()
);
create table public.wellness_plans (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  title text not null, category text not null check(category in ('exercise','nutrition','habit','education')),
  description text, source text not null default 'clinician' check(source in ('clinician','patient','demo','ai_generated')),
  status text not null default 'active' check(status in ('active','paused','complete','archived')),
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.wellness_records (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  plan_id uuid references public.wellness_plans(id) on delete set null, record_type text not null, value jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table public.ai_reports (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  report_type text not null, report_json jsonb not null, model_name text, provider text, date_range_start date, date_range_end date,
  generated_by uuid references auth.users(id) on delete set null,
  review_status text not null default 'unreviewed' check(review_status in ('unreviewed','reviewed','rejected')), created_at timestamptz not null default now()
);
create table public.ai_analysis_sources (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  report_id uuid not null references public.ai_reports(id) on delete cascade, source_type text not null, source_record_id uuid,
  source_date timestamptz, source_label text not null, created_at timestamptz not null default now()
);
create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  display_name text not null, relationship text, phone text not null, priority smallint not null default 1 check(priority>0),
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.emergency_alerts (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  alert_type text not null, status text not null default 'created' check(status in ('created','acknowledged','cancelled','closed')),
  message text, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  category text not null, channel text not null check(channel in ('in_app','email','sms','push')), enabled boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,category,channel)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), patient_id uuid references public.patient_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, category text not null, title text not null, message text not null,
  scheduled_at timestamptz, sent_at timestamptz, read_at timestamptz,
  delivery_status text not null default 'queued' check(delivery_status in ('queued','sent','failed','cancelled')), created_at timestamptz not null default now()
);
create table public.patient_sharing_sessions (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade, token_hash text not null unique,
  expires_at timestamptz not null, revoked_at timestamptz, access_scope text[] not null default '{general}', created_at timestamptz not null default now()
);

create index patient_relationships_user_idx on public.patient_relationships(user_id,status);
create index patient_relationships_patient_idx on public.patient_relationships(patient_id,status);
create index consent_records_scope_idx on public.consent_records(patient_id,scope,status,expires_at);
create index health_events_patient_date_idx on public.health_events(patient_id,occurred_at desc);
create index vitals_patient_type_date_idx on public.vitals(patient_id,vital_type,measured_at desc);
create index symptoms_patient_date_idx on public.symptom_observations(patient_id,observed_at desc);
create index appointments_patient_date_idx on public.appointments(patient_id,starts_at);
create index medication_schedules_patient_idx on public.medication_schedules(patient_id,status);
create index medical_documents_patient_idx on public.medical_documents(patient_id,created_at desc);
create index notifications_user_delivery_idx on public.notifications(user_id,delivery_status,scheduled_at);
create index audit_logs_patient_date_idx on public.audit_logs(patient_id,created_at desc);

create or replace function public.has_patient_access(target_patient uuid, requested_permission text default 'read')
returns boolean language sql stable security definer set search_path=public,auth as $$
  select exists (
    select 1 from public.patient_relationships r
    where r.patient_id=target_patient and r.user_id=auth.uid() and r.status='active'
      and case requested_permission
        when 'read' then r.can_read
        when 'write' then r.can_write
        when 'manage_documents' then r.can_write
        when 'manage_care' then r.can_write
        else false
      end
      and (r.relationship_role<>'doctor' or exists (
        select 1 from public.access_permissions ap where ap.patient_id=target_patient and ap.user_id=auth.uid()
          and ap.permission=requested_permission and ap.revoked_at is null and (ap.expires_at is null or ap.expires_at>now())
      ) or requested_permission='read' and exists (
        select 1 from public.access_permissions ap where ap.patient_id=target_patient and ap.user_id=auth.uid()
          and ap.permission='read' and ap.revoked_at is null and (ap.expires_at is null or ap.expires_at>now())
      ))
  );
$$;
create or replace function public.has_sensitive_access(target_patient uuid)
returns boolean language sql stable security definer set search_path=public,auth as $$
  select exists (select 1 from public.patient_relationships r where r.patient_id=target_patient and r.user_id=auth.uid() and r.relationship_role='patient' and r.status='active')
    or exists (select 1 from public.consent_records c where c.patient_id=target_patient and c.granted_to=auth.uid()
      and c.scope='sensitive_adolescent' and c.status='active' and c.revoked_at is null and (c.expires_at is null or c.expires_at>now()));
$$;
revoke all on function public.has_patient_access(uuid,text) from public,anon;
revoke all on function public.has_sensitive_access(uuid) from public,anon;
grant execute on function public.has_patient_access(uuid,text) to authenticated;
grant execute on function public.has_sensitive_access(uuid) to authenticated;

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end; $$;
do $$ declare tbl text; begin
  foreach tbl in array array['profiles','patient_profiles','medical_conditions','allergies','health_events','menstrual_records','medication_records','medication_schedules','medical_documents','doctors','hospitals','appointments','caregiver_tasks','wellness_plans','emergency_contacts','emergency_alerts','notification_preferences'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',tbl);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.patient_profiles enable row level security;
alter table public.patient_relationships enable row level security;
alter table public.guardianships enable row level security;
alter table public.consent_records enable row level security;
alter table public.access_permissions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.doctors enable row level security;
alter table public.hospitals enable row level security;
create policy "profile owner can read" on public.profiles for select to authenticated using(id=auth.uid());
create policy "profile owner can update" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy "users can read own roles" on public.user_roles for select to authenticated using(user_id=auth.uid());
create policy "owners and linked users can read patient profiles" on public.patient_profiles for select to authenticated using(created_by=auth.uid() or public.has_patient_access(id,'read'));
create policy "linked writers can update patient profiles" on public.patient_profiles for update to authenticated using(public.has_patient_access(id,'write')) with check(public.has_patient_access(id,'write'));
create policy "users can create own patient profile" on public.patient_profiles for insert to authenticated with check(created_by=auth.uid());
create policy "patient can create own relationship" on public.patient_relationships for insert to authenticated with check(user_id=auth.uid() and relationship_role='patient' and created_by=auth.uid() and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.created_by=auth.uid()));
create policy "linked users can read relationships" on public.patient_relationships for select to authenticated using(user_id=auth.uid() or public.has_patient_access(patient_id,'read'));
create policy "linked user can revoke relationship" on public.patient_relationships for update to authenticated using(user_id=auth.uid() or (public.has_patient_access(patient_id,'manage_care') and relationship_role<>'patient')) with check(status='revoked' and (user_id=auth.uid() or public.has_patient_access(patient_id,'manage_care')));
create policy "linked users can read guardianships" on public.guardianships for select to authenticated using(guardian_user_id=auth.uid() or public.has_patient_access(patient_id,'read'));
create policy "patient can create pending guardianship requests" on public.guardianships for insert to authenticated with check(public.has_patient_access(patient_id,'write') and consent_status='pending' and verified_by is null and verified_at is null);
create policy "patient manages consent" on public.consent_records for all to authenticated
  using(public.has_patient_access(patient_id,'write'))
  with check(public.has_patient_access(patient_id,'write') and granted_by=auth.uid()
    and (scope<>'sensitive_adolescent' or exists(select 1 from public.patient_relationships r where r.patient_id=patient_id and r.user_id=auth.uid() and r.relationship_role='patient' and r.status='active')));
create policy "linked users read permissions" on public.access_permissions for select to authenticated using(user_id=auth.uid() or public.has_patient_access(patient_id,'write'));
create policy "patient manages permissions" on public.access_permissions for all to authenticated using(public.has_patient_access(patient_id,'write')) with check(public.has_patient_access(patient_id,'write') and granted_by=auth.uid());
create policy "users read own audit logs" on public.audit_logs for select to authenticated using(actor_user_id=auth.uid());
create policy "users create own audit logs" on public.audit_logs for insert to authenticated with check(actor_user_id=auth.uid());
create policy "authenticated users can read verified doctor directory" on public.doctors for select to authenticated using(verification_status='verified' or user_id=auth.uid());
create policy "doctors can create unverified profile" on public.doctors for insert to authenticated with check(user_id=auth.uid() and verification_status<>'verified');
create policy "doctors update own unverified profile" on public.doctors for update to authenticated using(user_id=auth.uid() and verification_status<>'verified') with check(user_id=auth.uid() and verification_status<>'verified');
create policy "authenticated users can read hospital directory" on public.hospitals for select to authenticated using(true);

-- Patient-scoped RLS; sensitive adolescent rows require direct patient access or explicit consent.
do $$ declare tbl text; begin
  foreach tbl in array array['medical_conditions','allergies','health_events','vitals','symptom_observations','feeding_records','bowel_movement_records','vomiting_records','growth_records','menstrual_records','medication_records','medication_schedules','medication_administration_logs','medical_documents','extracted_document_data','laboratory_results','hospital_visits','hospital_admissions','appointments','caregiver_tasks','caregiver_handover_records','wellness_plans','wellness_records','ai_reports','ai_analysis_sources','emergency_contacts','emergency_alerts','patient_sharing_sessions'] loop
    execute format('alter table public.%I enable row level security',tbl);
    execute format('create policy "linked readers can read" on public.%I for select to authenticated using(public.has_patient_access(patient_id,''read'') and (coalesce(to_jsonb(%I)->>''visibility'',''general'')<>''sensitive_adolescent'' or public.has_sensitive_access(patient_id)))',tbl,tbl);
    execute format('create policy "linked writers can insert" on public.%I for insert to authenticated with check(public.has_patient_access(patient_id,''write'') and (coalesce(to_jsonb(%I)->>''visibility'',''general'')<>''sensitive_adolescent'' or public.has_sensitive_access(patient_id)) and (to_jsonb(%I)->>''created_by'' is null or to_jsonb(%I)->>''created_by''=auth.uid()::text))',tbl,tbl,tbl,tbl);
    execute format('create policy "linked writers can update" on public.%I for update to authenticated using(public.has_patient_access(patient_id,''write'') and (coalesce(to_jsonb(%I)->>''visibility'',''general'')<>''sensitive_adolescent'' or public.has_sensitive_access(patient_id))) with check(public.has_patient_access(patient_id,''write'') and (coalesce(to_jsonb(%I)->>''visibility'',''general'')<>''sensitive_adolescent'' or public.has_sensitive_access(patient_id)))',tbl,tbl,tbl);
    execute format('create policy "linked writers can delete" on public.%I for delete to authenticated using(public.has_patient_access(patient_id,''write''))',tbl);
  end loop;
end $$;

alter table public.notification_preferences enable row level security;
create policy "users manage own notification preferences" on public.notification_preferences for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
alter table public.notifications enable row level security;
create policy "users read own notifications" on public.notifications for select to authenticated using(user_id=auth.uid() and (patient_id is null or public.has_patient_access(patient_id,'read')));
create policy "users update own notifications" on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "users create own notifications" on public.notifications for insert to authenticated with check(user_id=auth.uid() and (patient_id is null or public.has_patient_access(patient_id,'write')));

-- Private bucket. Object paths follow <patient UUID>/<file name>.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('medical-documents','medical-documents',false,10485760,array['application/pdf','image/jpeg','image/png'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "linked readers can read medical files" on storage.objects for select to authenticated
  using(bucket_id='medical-documents' and public.has_patient_access(((storage.foldername(name))[1])::uuid,'read'));
create policy "linked writers can upload medical files" on storage.objects for insert to authenticated
  with check(bucket_id='medical-documents' and public.has_patient_access(((storage.foldername(name))[1])::uuid,'manage_documents'));
create policy "linked writers can update medical files" on storage.objects for update to authenticated
  using(bucket_id='medical-documents' and public.has_patient_access(((storage.foldername(name))[1])::uuid,'manage_documents'))
  with check(bucket_id='medical-documents' and public.has_patient_access(((storage.foldername(name))[1])::uuid,'manage_documents'));
create policy "linked writers can delete medical files" on storage.objects for delete to authenticated
  using(bucket_id='medical-documents' and public.has_patient_access(((storage.foldername(name))[1])::uuid,'manage_documents'));
