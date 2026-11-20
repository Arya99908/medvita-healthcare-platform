-- Run only against the dedicated Med-Vita project with:
-- supabase db query --linked --file supabase/tests/rls_access.test.sql
-- All fixtures are fictional and enclosed in a transaction that is rolled back.
begin;
create extension if not exists pgtap with schema extensions;

select extensions.plan(142);

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
  ('11111111-1111-4111-8111-111111111111','authenticated','authenticated','medvita-rls-patient-a@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
  ('22222222-2222-4222-8222-222222222222','authenticated','authenticated','medvita-rls-patient-b@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
  ('33333333-3333-4333-8333-333333333333','authenticated','authenticated','medvita-rls-guardian@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
  ('44444444-4444-4444-8444-444444444444','authenticated','authenticated','medvita-rls-doctor@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
  ('55555555-5555-4555-8555-555555555555','authenticated','authenticated','medvita-rls-requester@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
  ('66666666-6666-4666-8666-666666666666','authenticated','authenticated','medvita-invitee@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
  ('77777777-7777-4777-8777-777777777777','authenticated','authenticated','medvita-unverified-doctor@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now());

insert into public.doctors(user_id,display_name,verification_status)
values
  ('44444444-4444-4444-8444-444444444444','Fictional verified doctor','verified'),
  ('77777777-7777-4777-8777-777777777777','Fictional unverified doctor','unverified');

insert into public.patient_profiles(id,created_by,display_name,life_stage)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Fictional adolescent A','adolescent'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','Fictional patient B','adult'),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc1','22222222-2222-4222-8222-222222222222','Fictional child C','child');

insert into public.patient_sharing_sessions(patient_id,created_by,token_hash,expires_at)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','fictional-sharing-token-hash',now()+interval '1 hour');

insert into public.patient_relationships(patient_id,user_id,relationship_role,can_read,can_write,status,created_by)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','patient',true,true,'active','11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','patient',true,true,'active','22222222-2222-4222-8222-222222222222'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','33333333-3333-4333-8333-333333333333','guardian',true,false,'active','11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','33333333-3333-4333-8333-333333333333','caregiver',true,true,'active','22222222-2222-4222-8222-222222222222'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444','doctor',true,true,'active','11111111-1111-4111-8111-111111111111');

insert into public.access_permissions(patient_id,user_id,permission,granted_by)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444','read','11111111-1111-4111-8111-111111111111');

insert into public.health_events(patient_id,event_type,title,source,visibility,created_by)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','note','Fictional general event','patient','general','11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','note','Fictional sensitive event','patient','sensitive_adolescent','11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','note','Other fictional patient event','patient','general','22222222-2222-4222-8222-222222222222');

insert into public.menstrual_records(patient_id,period_start,period_end,flow_note,visibility,created_by)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-11-03','2026-11-07','Fictional private cycle note','sensitive_adolescent','11111111-1111-4111-8111-111111111111');

insert into public.medication_records(id,patient_id,medicine_name,status,created_by)
values('dddddddd-dddd-4ddd-8ddd-dddddddddddd','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fictional patient B medicine','active','22222222-2222-4222-8222-222222222222');

insert into public.appointments(id,patient_id,title,starts_at,status,created_by)
values('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fictional patient B appointment','2026-11-22 03:30:00+00','scheduled','22222222-2222-4222-8222-222222222222');

select extensions.ok(has_table_privilege('authenticated','public.health_events','INSERT'),'authenticated role has insert privilege for the RLS write-denial check');

set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select set_config('medvita.test_export',public.export_my_data()::text,true);
select extensions.is((select count(*) from public.health_events where patient_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),2::bigint,'patient can read own general and sensitive events');
select extensions.is((select count(*) from public.health_events where patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),0::bigint,'patient cannot read another patient events');
select extensions.is(jsonb_array_length(current_setting('medvita.test_export')::jsonb #> '{tables,patient_profiles}'),1,'export includes only the caller-visible patient profile');
select extensions.is((current_setting('medvita.test_export')::jsonb #> '{tables,patient_profiles}') @> jsonb_build_array(jsonb_build_object('id','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')),false,'export omits another patient profile');
select extensions.is(jsonb_array_length(current_setting('medvita.test_export')::jsonb #> '{tables,health_events}'),2,'export includes only RLS-visible health events');
select extensions.is(jsonb_array_length(current_setting('medvita.test_export')::jsonb #> '{tables,urination_records}'),0,'export includes an empty urination log list when no visible records exist');
select extensions.is(jsonb_array_length(current_setting('medvita.test_export')::jsonb #> '{tables,sleep_records}'),0,'export includes an empty sleep log list when no visible records exist');
select extensions.is(jsonb_array_length(current_setting('medvita.test_export')::jsonb #> '{tables,vaccination_records}'),0,'export includes an empty child vaccination list when no visible records exist');
select extensions.is(jsonb_array_length(current_setting('medvita.test_export')::jsonb #> '{tables,developmental_milestones}'),0,'export includes an empty child milestone list when no visible records exist');
select extensions.is(jsonb_array_length(current_setting('medvita.test_export')::jsonb #> '{tables,patient_sharing_sessions}'),1,'export includes the caller-visible sharing session');
select extensions.is(coalesce(((current_setting('medvita.test_export')::jsonb #> '{tables,patient_sharing_sessions,0}') ? 'token_hash'),false),false,'export omits the sharing token hash');
select extensions.is(current_setting('medvita.test_export')::jsonb #>> '{account_id}','11111111-1111-4111-8111-111111111111','export identifies the authenticated account');

reset role;
insert into public.patient_relationships(patient_id,user_id,relationship_role,can_read,can_write,status,created_by)
values('cccccccc-cccc-4ccc-8ccc-ccccccccccc1','33333333-3333-4333-8333-333333333333','guardian',true,true,'active','22222222-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select extensions.is((select count(*) from public.health_events where patient_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and visibility='general'),1::bigint,'guardian can read linked general event');
select extensions.is((select count(*) from public.health_events where patient_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and visibility='sensitive_adolescent'),0::bigint,'guardian cannot read sensitive adolescent event without consent');
select extensions.is((select count(*) from public.menstrual_records where patient_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),0::bigint,'guardian cannot read private cycle records without consent');

select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
select extensions.is((select count(*) from public.health_events where patient_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and visibility='general'),1::bigint,'doctor with explicit read permission can read general event');
select extensions.throws_ok($$insert into public.health_events(patient_id,event_type,title,created_by) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','note','Unauthorized fictional write','44444444-4444-4444-8444-444444444444')$$,'42501',null,'doctor without write permission cannot insert patient event');
select extensions.is((select count(*) from public.health_events where patient_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and visibility='sensitive_adolescent'),0::bigint,'doctor without sensitive consent cannot read adolescent event');

reset role;
insert into public.consent_records(patient_id,granted_by,granted_to,scope,purpose,status)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','sensitive_adolescent','Fictional RLS test','active');

set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select extensions.is((select count(*) from public.health_events where patient_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and visibility='sensitive_adolescent'),1::bigint,'guardian can read sensitive event after explicit consent');
select extensions.is((select count(*) from public.menstrual_records where patient_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),1::bigint,'guardian can read private cycle record only after explicit consent');
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
select extensions.is((select count(*) from public.health_events where patient_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and visibility='sensitive_adolescent'),0::bigint,'guardian consent does not grant sensitive access to a doctor');

select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select extensions.throws_ok($$insert into public.patient_relationships(patient_id,user_id,relationship_role,can_read,can_write,status,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','patient',true,true,'active','11111111-1111-4111-8111-111111111111')$$,'42501',null,'patient cannot link themself to another patient profile');
select extensions.lives_ok($$insert into public.health_events(patient_id,event_type,title,created_by) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','care_note','Fictional authorized timeline entry','11111111-1111-4111-8111-111111111111')$$,'patient with active write access can add an own-profile entry');
select extensions.throws_ok($$insert into public.health_events(patient_id,event_type,title,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','care_note','Fictional unauthorized timeline entry','11111111-1111-4111-8111-111111111111')$$,'42501',null,'patient cannot add an entry to another patient profile');
select extensions.lives_ok($$insert into public.symptom_observations(patient_id,symptom,severity,created_by) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Fictional authorized observation',2,'11111111-1111-4111-8111-111111111111')$$,'patient with active write access can add an own-profile symptom observation');
select extensions.throws_ok($$insert into public.symptom_observations(patient_id,symptom,severity,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fictional unauthorized observation',2,'11111111-1111-4111-8111-111111111111')$$,'42501',null,'patient cannot add an observation to another patient profile');
select extensions.lives_ok($$insert into public.feeding_records(patient_id,feeding_type,quantity_ml,created_by) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','formula',120,'11111111-1111-4111-8111-111111111111')$$,'patient with active write access can add own-profile feeding log');
select extensions.throws_ok($$insert into public.feeding_records(patient_id,feeding_type,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','formula','11111111-1111-4111-8111-111111111111')$$,'42501',null,'patient cannot add a feeding log to another patient profile');
select extensions.lives_ok($$insert into public.bowel_movement_records(patient_id,consistency,created_by) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Fictional sample','11111111-1111-4111-8111-111111111111')$$,'patient with active write access can add own-profile bowel log');
select extensions.throws_ok($$insert into public.bowel_movement_records(patient_id,consistency,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fictional sample','11111111-1111-4111-8111-111111111111')$$,'42501',null,'patient cannot add a bowel log to another patient profile');
select extensions.lives_ok($$insert into public.vomiting_records(patient_id,count,created_by) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',2,'11111111-1111-4111-8111-111111111111')$$,'patient with active write access can add own-profile vomiting log');
select extensions.throws_ok($$insert into public.vomiting_records(patient_id,count,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',2,'11111111-1111-4111-8111-111111111111')$$,'42501',null,'patient cannot add a vomiting log to another patient profile');
select extensions.lives_ok($$insert into public.growth_records(patient_id,weight_kg,created_by) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',8.25,'11111111-1111-4111-8111-111111111111')$$,'patient with active write access can add own-profile growth measurement');
select extensions.throws_ok($$insert into public.growth_records(patient_id,weight_kg,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',8.25,'11111111-1111-4111-8111-111111111111')$$,'42501',null,'patient cannot add a growth measurement to another patient profile');
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select extensions.lives_ok($$insert into public.vitals(patient_id,vital_type,value,unit,source,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','blood_pressure_systolic',122,'mmHg','patient','22222222-2222-4222-8222-222222222222')$$,'adult with active write access can add own-profile vital reading');
select extensions.throws_ok($$insert into public.vitals(patient_id,vital_type,value,unit,source,created_by) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','blood_pressure_systolic',122,'mmHg','patient','22222222-2222-4222-8222-222222222222')$$,'42501',null,'adult cannot add a vital reading to another patient profile');
select extensions.lives_ok($$insert into public.appointments(id,patient_id,event_type,title,starts_at,notes,created_by) values('77777777-7777-4777-8777-777777777777','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','laboratory_test','Fictional calendar test','2026-11-21 03:30:00+00','Fictional note','22222222-2222-4222-8222-222222222222')$$,'adult with active write access can create a typed calendar event');
select extensions.throws_ok($$insert into public.appointments(patient_id,event_type,title,starts_at,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','unsupported_event','Fictional invalid event','2026-11-21 03:30:00+00','22222222-2222-4222-8222-222222222222')$$,'23514',null,'calendar event type must be one of the supported values');
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select extensions.lives_ok($$insert into public.vitals(patient_id,vital_type,value,unit,source,created_by) values('cccccccc-cccc-4ccc-8ccc-ccccccccccc1','temperature',38.2,'°C','caregiver','33333333-3333-4333-8333-333333333333')$$,'linked caregiver can record a child temperature');
select extensions.throws_ok($$insert into public.vitals(patient_id,vital_type,value,unit,source,created_by) values('cccccccc-cccc-4ccc-8ccc-ccccccccccc1','blood_pressure_systolic',110,'mmHg','caregiver','33333333-3333-4333-8333-333333333333')$$,'42501',null,'child vitals are limited to temperature readings');
select extensions.lives_ok($$insert into public.vaccination_records(patient_id,vaccine_name,dose_label,status,due_on,source,created_by) values('cccccccc-cccc-4ccc-8ccc-ccccccccccc1','Fictional sample vaccine','Dose 1','planned','2026-12-15','caregiver','33333333-3333-4333-8333-333333333333')$$,'linked caregiver can add a child vaccination date');
select extensions.lives_ok($$insert into public.developmental_milestones(patient_id,milestone_name,domain,status,recorded_on,source,created_by) values('cccccccc-cccc-4ccc-8ccc-ccccccccccc1','Fictional sample observation','motor','observed','2026-11-20','caregiver','33333333-3333-4333-8333-333333333333')$$,'linked caregiver can record a child milestone observation');
select extensions.throws_ok($$insert into public.developmental_milestones(patient_id,milestone_name,domain,status,recorded_on,source,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fictional sample observation','motor','observed','2026-11-20','caregiver','33333333-3333-4333-8333-333333333333')$$,'42501',null,'milestone observations cannot be added to adult profiles');
select extensions.throws_ok($$insert into public.developmental_milestones(patient_id,milestone_name,domain,status,recorded_on,source,created_by) values('cccccccc-cccc-4ccc-8ccc-ccccccccccc1','Fictional follow-up','communication','follow_up','2026-11-20','caregiver','33333333-3333-4333-8333-333333333333')$$,'23514',null,'a planned milestone follow-up requires a follow-up date');
reset role;
insert into public.patient_relationships(patient_id,user_id,relationship_role,can_read,can_write,status,created_by)
values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','33333333-3333-4333-8333-333333333333','guardian',true,true,'active','22222222-2222-4222-8222-222222222222');
insert into public.medical_documents(id,patient_id,storage_path,document_type,display_name,uploaded_by)
values('dddddddd-dddd-4ddd-8ddd-dddddddddddd','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/general/fictional-vaccine.pdf','other','Fictional unrelated record','22222222-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select extensions.throws_ok($$insert into public.vaccination_records(patient_id,vaccine_name,status,due_on,source,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fictional vaccine','planned','2026-12-15','caregiver','33333333-3333-4333-8333-333333333333')$$,'42501',null,'child vaccination records cannot be added to adult profiles');
select extensions.throws_ok($$insert into public.vaccination_records(patient_id,vaccine_name,status,due_on,document_id,source,created_by) values('cccccccc-cccc-4ccc-8ccc-ccccccccccc1','Fictional vaccine','planned','2026-12-15','dddddddd-dddd-4ddd-8ddd-dddddddddddd','caregiver','33333333-3333-4333-8333-333333333333')$$,'23503',null,'vaccination evidence must belong to the same patient profile');
select extensions.lives_ok($$insert into public.urination_records(patient_id,urination_type,count,source,created_by) values('cccccccc-cccc-4ccc-8ccc-ccccccccccc1','wet_diaper',3,'caregiver','33333333-3333-4333-8333-333333333333')$$,'linked caregiver can add a child wet-diaper log');
select extensions.throws_ok($$insert into public.urination_records(patient_id,urination_type,count,source,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','wet_diaper',3,'caregiver','33333333-3333-4333-8333-333333333333')$$,'42501',null,'caregiver cannot add child urination log to an adult or unlinked profile');
select extensions.lives_ok($$insert into public.sleep_records(patient_id,sleep_type,started_at,ended_at,source,created_by) values('cccccccc-cccc-4ccc-8ccc-ccccccccccc1','overnight','2026-11-19 19:00:00+00','2026-11-20 03:00:00+00','caregiver','33333333-3333-4333-8333-333333333333')$$,'linked caregiver can add a child sleep log');
select extensions.throws_ok($$insert into public.sleep_records(patient_id,sleep_type,started_at,ended_at,source,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','overnight','2026-11-19 19:00:00+00','2026-11-20 03:00:00+00','caregiver','33333333-3333-4333-8333-333333333333')$$,'42501',null,'caregiver cannot add child sleep log to an adult or unlinked profile');
select extensions.throws_ok($$insert into public.sleep_records(patient_id,sleep_type,started_at,ended_at,source,created_by) values('cccccccc-cccc-4ccc-8ccc-ccccccccccc1','nap','2026-11-20 10:00:00+00','2026-11-20 09:00:00+00','caregiver','33333333-3333-4333-8333-333333333333')$$,'23514',null,'sleep log must end after it starts');
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select extensions.lives_ok($$insert into public.menstrual_records(patient_id,period_start,visibility,created_by) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-11-15','sensitive_adolescent','11111111-1111-4111-8111-111111111111')$$,'adolescent can add own private cycle record');
select extensions.throws_ok($$insert into public.menstrual_records(patient_id,period_start,visibility,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','2026-11-15','sensitive_adolescent','11111111-1111-4111-8111-111111111111')$$,'42501',null,'adolescent cannot add private cycle record to another patient');
select extensions.lives_ok($$insert into public.appointments(id,patient_id,title,starts_at,created_by) values('ffffffff-ffff-4fff-8fff-ffffffffffff','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Fictional authorized appointment','2026-11-21 03:30:00+00','11111111-1111-4111-8111-111111111111')$$,'patient with active write access can add an own-profile appointment');
select extensions.throws_ok($$insert into public.appointments(patient_id,title,starts_at,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fictional unauthorized appointment','2026-11-21 03:30:00+00','11111111-1111-4111-8111-111111111111')$$,'42501',null,'patient cannot add an appointment to another patient profile');
select extensions.lives_ok($$update public.appointments set status='completed' where id='ffffffff-ffff-4fff-8fff-ffffffffffff'$$,'patient with active write access can update own appointment plan');
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select extensions.lives_ok($$insert into public.caregiver_tasks(id,patient_id,title,due_at,assigned_to,created_by) values('99999999-9999-4999-8999-999999999999','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fictional authorized care task','2026-12-21 00:00:00+00','22222222-2222-4222-8222-222222222222','22222222-2222-4222-8222-222222222222')$$,'patient with active write access can add an own-profile care task');
select extensions.throws_ok($$insert into public.caregiver_tasks(patient_id,title,assigned_to,created_by) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Fictional unauthorized care task','22222222-2222-4222-8222-222222222222','22222222-2222-4222-8222-222222222222')$$,'42501',null,'patient cannot add a care task to another patient profile');
select extensions.lives_ok($$insert into public.caregiver_tasks(id,patient_id,title,due_at,assigned_to,created_by) values('abababab-abab-4bab-8bab-abababababab','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fictional task assigned to caregiver','2026-11-19 00:00:00+00','33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222')$$,'patient can assign a task to an active writable caregiver');
select extensions.is((select count(*) from public.notifications where user_id='33333333-3333-4333-8333-333333333333' and patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),0::bigint,'task creator cannot read a notification addressed to another account');
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select extensions.is((select count(*) from public.notifications where category='caregiver_task' and patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),1::bigint,'assigned caregiver receives one in-app task notification by default');
select extensions.is((select title from public.notifications where category='caregiver_task' and patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' limit 1),'A care task was assigned to you','notification text does not include the task title or health details');
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
insert into public.notification_preferences(user_id,category,channel,enabled) values('33333333-3333-4333-8333-333333333333','caregiver_task','in_app',false);
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
insert into public.caregiver_tasks(id,patient_id,title,assigned_to,created_by) values('cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fictional task while alerts are off','33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222');
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select extensions.is((select count(*) from public.notifications where category='caregiver_task' and patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),1::bigint,'disabled in-app preference suppresses new task notifications');
update public.notification_preferences set enabled=true where user_id='33333333-3333-4333-8333-333333333333' and category='caregiver_task' and channel='in_app';
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
insert into public.caregiver_tasks(id,patient_id,title,assigned_to,created_by) values('dededede-dede-4ded-8ded-dededededede','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fictional task after alerts resume','33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222');
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select extensions.is((select count(*) from public.notifications where category='caregiver_task' and patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),2::bigint,'enabling in-app preference restores task notifications');
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select extensions.throws_ok($$insert into public.caregiver_tasks(patient_id,title,assigned_to,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fictional task for unlinked user','55555555-5555-4555-8555-555555555555','22222222-2222-4222-8222-222222222222')$$,'42501',null,'patient cannot assign a task to an unlinked account');
select extensions.throws_ok($$update public.caregiver_tasks set status='missed' where id='99999999-9999-4999-8999-999999999999'$$,'42501',null,'care task cannot be marked missed before its due time');
select extensions.lives_ok($$update public.caregiver_tasks set status='complete' where id='99999999-9999-4999-8999-999999999999'$$,'patient with active write access can complete own care task');
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select extensions.lives_ok($$update public.caregiver_tasks set status='missed' where id='abababab-abab-4bab-8bab-abababababab'$$,'assigned caregiver can mark their past-due task missed');
with changed as (update public.caregiver_tasks set status='complete' where id='99999999-9999-4999-8999-999999999999' returning id)
select extensions.is((select count(*) from changed),0::bigint,'caregiver cannot complete another persons task');
with deleted as (delete from public.caregiver_tasks where id='abababab-abab-4bab-8bab-abababababab' returning id)
select extensions.is((select count(*) from deleted),1::bigint,'assigned caregiver can remove their own task');
with deleted as (delete from public.caregiver_tasks where id='99999999-9999-4999-8999-999999999999' returning id)
select extensions.is((select count(*) from deleted),0::bigint,'caregiver cannot remove a task assigned to another person');
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select extensions.lives_ok($$insert into public.medication_schedules(id,patient_id,medication_id,frequency,administration_times,created_by) values('88888888-8888-4888-8888-888888888888','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','dddddddd-dddd-4ddd-8ddd-dddddddddddd','Fictional schedule','["08:00","20:00"]','22222222-2222-4222-8222-222222222222')$$,'patient with active write access can add a schedule for own medicine note');
select extensions.throws_ok($$insert into public.medication_schedules(patient_id,medication_id,frequency,created_by) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','dddddddd-dddd-4ddd-8ddd-dddddddddddd','Fictional unauthorized schedule','22222222-2222-4222-8222-222222222222')$$,'42501',null,'patient cannot create a medication schedule for another profile');
select extensions.lives_ok($$insert into public.medication_administration_logs(patient_id,medication_id,schedule_id,status,recorded_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','dddddddd-dddd-4ddd-8ddd-dddddddddddd','88888888-8888-4888-8888-888888888888','taken','22222222-2222-4222-8222-222222222222')$$,'patient with active write access can record a dose event for own medicine note');
select extensions.throws_ok($$insert into public.medication_administration_logs(patient_id,medication_id,status,recorded_by) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','dddddddd-dddd-4ddd-8ddd-dddddddddddd','taken','22222222-2222-4222-8222-222222222222')$$,'42501',null,'patient cannot record a dose event for another profile');
select extensions.lives_ok($$insert into public.emergency_contacts(patient_id,display_name,phone,priority,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fictional emergency contact','+91 98765 43210',1,'22222222-2222-4222-8222-222222222222')$$,'patient with active write access can save an emergency contact');
select extensions.lives_ok($$insert into public.emergency_alerts(patient_id,alert_type,status,message,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','ambulance_call_requested','created','Fictional manual action record; no call was sent','22222222-2222-4222-8222-222222222222')$$,'patient with active write access can record an emergency action');
select extensions.lives_ok($$insert into public.caregiver_handover_records(patient_id,from_user_id,to_user_id,handover_text,visibility) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','Fictional handover summary','general')$$,'writer can hand over to an active linked reader');
select extensions.throws_ok($$insert into public.caregiver_handover_records(patient_id,from_user_id,to_user_id,handover_text,visibility) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','Fictional forged handover','general')$$,'42501',null,'writer cannot forge the handover author');
select extensions.throws_ok($$insert into public.caregiver_handover_records(patient_id,from_user_id,to_user_id,handover_text,visibility) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','55555555-5555-4555-8555-555555555555','Fictional unlinked handover','general')$$,'42501',null,'writer cannot target an unlinked handover recipient');
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select extensions.throws_ok($$select * from public.create_patient_invitation('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','medvita-invitee@example.invalid','caregiver',false)$$,'42501',null,'linked caregiver cannot invite additional users to another profile');
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select set_config('medvita.invitation_token',(select invitation_token from public.create_patient_invitation('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','medvita-invitee@example.invalid','caregiver',false)),true);
select extensions.is((select count(*) from public.patient_invitations where invited_email='medvita-invitee@example.invalid' and token_hash<>current_setting('medvita.invitation_token')),1::bigint,'invitation token is stored only as a hash');
select set_config('medvita.invitation_export',public.export_my_data()::text,true);
select extensions.is(jsonb_array_length(current_setting('medvita.invitation_export')::jsonb #> '{tables,patient_invitations}'),1,'account export includes the caller-visible invitation');
select extensions.is(coalesce(((current_setting('medvita.invitation_export')::jsonb #> '{tables,patient_invitations,0}') ? 'token_hash'),false),false,'account export omits invitation token hashes');
select set_config('request.jwt.claim.sub','66666666-6666-4666-8666-666666666666',true);
select extensions.lives_ok($$select public.accept_patient_invitation(current_setting('medvita.invitation_token'))$$,'email-matched invitee can accept the invitation');
select extensions.is((select count(*) from public.patient_relationships where patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and user_id='66666666-6666-4666-8666-666666666666' and relationship_role='caregiver' and status='active' and can_read and not can_write),1::bigint,'read-only invitation creates only read access');
select extensions.throws_ok($$select public.accept_patient_invitation(current_setting('medvita.invitation_token'))$$,'22023',null,'accepted invitation token cannot be reused');
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select set_config('medvita.wrong_email_token',(select invitation_token from public.create_patient_invitation('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','medvita-rls-requester@example.invalid','family_member',false)),true);
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
select extensions.throws_ok($$select public.accept_patient_invitation(current_setting('medvita.wrong_email_token'))$$,'42501',null,'invitation cannot be accepted by a different email account');
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select set_config('medvita.revoked_invitation',(select invitation_id::text from public.create_patient_invitation('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','medvita-rls-doctor@example.invalid','family_member',false)),true);
select extensions.is(public.revoke_patient_invitation(current_setting('medvita.revoked_invitation')::uuid),true,'inviter can revoke an unused caregiver invitation');
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select extensions.throws_ok($$insert into public.emergency_contacts(patient_id,display_name,phone,priority,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fictional unauthorized contact','+91 98765 43210',1,'11111111-1111-4111-8111-111111111111')$$,'42501',null,'patient cannot add an emergency contact to another profile');
select extensions.throws_ok($$insert into public.emergency_alerts(patient_id,alert_type,status,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','sos_call_requested','created','11111111-1111-4111-8111-111111111111')$$,'42501',null,'patient cannot record an emergency action for another profile');
with changed as (update public.appointments set status='cancelled' where id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' returning id)
select extensions.is((select count(*) from changed),0::bigint,'patient cannot update another patient appointment plan');
reset role;
select extensions.is((select status from public.appointments where id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'),'scheduled','unauthorized appointment update leaves the other patient plan unchanged');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select extensions.lives_ok($$insert into public.medication_records(id,patient_id,medicine_name,created_by) values('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Fictional authorized medicine','11111111-1111-4111-8111-111111111111')$$,'patient with active write access can add an own-profile medicine note');
select extensions.throws_ok($$insert into public.medication_records(patient_id,medicine_name,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fictional unauthorized medicine','11111111-1111-4111-8111-111111111111')$$,'42501',null,'patient cannot add a medicine note to another patient profile');
select extensions.lives_ok($$insert into public.medical_documents(patient_id,storage_path,document_type,display_name,uploaded_by) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/general/fictional.pdf','other','Fictional authorized document','11111111-1111-4111-8111-111111111111')$$,'patient with active write access can add own-profile document metadata');
select extensions.throws_ok($$insert into public.medical_documents(patient_id,storage_path,document_type,display_name,uploaded_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/general/fictional.pdf','other','Fictional unauthorized document','11111111-1111-4111-8111-111111111111')$$,'42501',null,'patient cannot add document metadata to another patient profile');
select extensions.lives_ok($$update public.medication_records set status='historical' where id='cccccccc-cccc-4ccc-8ccc-cccccccccccc'$$,'patient with active write access can update own medicine-note status');
with changed as (update public.medication_records set status='historical' where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd' returning id)
select extensions.is((select count(*) from changed),0::bigint,'patient cannot update another patient medicine-note status');
reset role;
select extensions.is((select status from public.medication_records where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd'),'active','unauthorized medicine-note status update leaves the other patient record unchanged');
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
with changed as (update public.medication_records set medicine_name='Fictional edited by another caregiver' where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd' returning id)
select extensions.is((select count(*) from changed),0::bigint,'linked caregiver cannot edit another users medicine note');
reset role;
select extensions.is((select medicine_name from public.medication_records where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd'),'Fictional patient B medicine','linked caregiver update leaves the medicine note unchanged');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);

select set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',true);
select extensions.lives_ok($$select public.create_patient_profile('Fictional adult self','adult',null,'en',false)$$,'authenticated user can create own adult profile');
select extensions.is((select count(*) from public.patient_profiles where display_name='Fictional adult self'),1::bigint,'creator can read newly created self profile');
select extensions.is((select count(*) from public.patient_relationships r join public.patient_profiles p on p.id=r.patient_id where p.display_name='Fictional adult self' and r.user_id='55555555-5555-4555-8555-555555555555' and r.relationship_role='patient' and r.status='active' and r.can_read and r.can_write),1::bigint,'self profile receives active read/write relationship');
select extensions.throws_ok($$select public.create_patient_profile('Fictional child request','child',null,'en',false)$$,'42501',null,'minor profile requires guardian attestation');
select set_config('medvita.test_minor_id',public.create_patient_profile('Fictional infant request','infant',null,'en',true)::text,true);
select extensions.is((select count(*) from public.patient_relationships where patient_id=current_setting('medvita.test_minor_id')::uuid and user_id='55555555-5555-4555-8555-555555555555' and relationship_role='guardian' and status='pending' and not can_read and not can_write),1::bigint,'minor profile guardian relationship remains pending without access');

reset role;
insert into public.health_events(patient_id,event_type,title,visibility,created_by)
values(current_setting('medvita.test_minor_id')::uuid,'note','Pending profile inaccessible event','general','55555555-5555-4555-8555-555555555555');
set local role authenticated;
select extensions.is((select count(*) from public.health_events where patient_id=current_setting('medvita.test_minor_id')::uuid),0::bigint,'pending guardian cannot read minor profile records');
select set_config('request.jwt.claim.sub','',true);
set local role anon;
select extensions.throws_ok($$select public.create_patient_profile('Anonymous profile','adult',null,'en',false)$$,'42501',null,'anonymous user cannot create a patient profile');
select extensions.throws_ok($$select public.export_my_data()$$,'42501',null,'anonymous user cannot export patient data');

reset role;
insert into public.patient_relationships(patient_id,user_id,relationship_role,can_read,can_write,status,created_by)
values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','77777777-7777-4777-8777-777777777777','doctor',true,false,'active','22222222-2222-4222-8222-222222222222');
insert into public.access_permissions(patient_id,user_id,permission,granted_by)
values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','77777777-7777-4777-8777-777777777777','read','22222222-2222-4222-8222-222222222222'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','77777777-7777-4777-8777-777777777777','clinical_notes','22222222-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claim.sub','77777777-7777-4777-8777-777777777777',true);
select extensions.is((select count(*) from public.patient_profiles where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),0::bigint,'unverified doctor cannot read a patient profile even with a relationship and read grant');
select extensions.throws_ok($$insert into public.clinical_notes(patient_id,doctor_user_id,note_kind,title,body) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','77777777-7777-4777-8777-777777777777','consultation','Unverified note','Should be rejected')$$,'42501',null,'unverified doctor cannot add a clinical note despite a direct permission row');
reset role;
delete from public.patient_relationships where patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and user_id='77777777-7777-4777-8777-777777777777' and relationship_role='doctor';
delete from public.access_permissions where patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and user_id='77777777-7777-4777-8777-777777777777' and permission in ('read','clinical_notes');
set local role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select extensions.lives_ok($$insert into public.consent_records(patient_id,granted_by,granted_to,scope,purpose,expires_at) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','22222222-2222-4222-8222-222222222222','ai_summary','One-time fictional AI summary consent',now()+interval '10 minutes')$$,'patient can record short-lived one-time consent for AI summaries');
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select extensions.throws_ok($$insert into public.consent_records(patient_id,granted_by,granted_to,scope,purpose,expires_at) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','33333333-3333-4333-8333-333333333333','33333333-3333-4333-8333-333333333333','ai_summary','Caregiver cannot self-authorize AI data sharing',now()+interval '10 minutes')$$,'42501',null,'writable caregiver cannot grant AI processing consent for the patient');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select extensions.throws_ok($$select * from public.create_patient_invitation('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','medvita-invitee@example.invalid','doctor',false)$$,'42501',null,'patient cannot invite an unverified doctor');
select set_config('medvita.doctor_invitation_token',(select invitation_token from public.create_patient_invitation('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','medvita-rls-doctor@example.invalid','doctor',false)),true);
select extensions.is((select count(*) from public.patient_invitations where patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and relationship_role='doctor' and not can_write and accepted_at is null),1::bigint,'patient invitation grants only read-only doctor role pending acceptance');
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
select extensions.lives_ok($$select public.accept_patient_invitation(current_setting('medvita.doctor_invitation_token'))$$,'verified doctor with the invited email can accept patient consent');
select extensions.is((select count(*) from public.patient_relationships where patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and user_id='44444444-4444-4444-8444-444444444444' and relationship_role='doctor' and status='active' and can_read and not can_write),1::bigint,'accepted doctor relationship is active and read-only');
select extensions.ok((select expires_at > now()+interval '89 days' and expires_at <= now()+interval '91 days' from public.access_permissions where patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and user_id='44444444-4444-4444-8444-444444444444' and permission='read' and revoked_at is null),'doctor read permission expires after 90 days');
select extensions.ok((select expires_at > now()+interval '89 days' and expires_at <= now()+interval '91 days' from public.access_permissions where patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and user_id='44444444-4444-4444-8444-444444444444' and permission='clinical_notes' and revoked_at is null),'doctor clinical-note permission expires after 90 days');
select extensions.is((select count(*) from public.patient_profiles where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),1::bigint,'consented doctor can read the linked patient profile');
select extensions.lives_ok($$insert into public.clinical_notes(id,patient_id,doctor_user_id,note_kind,title,body,follow_up_on) values('99999999-9999-4999-8999-999999999997','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','44444444-4444-4444-8444-444444444444','follow_up','Fictional clinician follow-up','Fictional clinician-authored note','2026-12-01')$$,'consented verified doctor can append a clinical note');
select extensions.is((select count(*) from public.clinical_notes where patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and id='99999999-9999-4999-8999-999999999997'),1::bigint,'clinician note is visible to its author');
select extensions.throws_ok($$update public.clinical_notes set body='Changed content' where id='99999999-9999-4999-8999-999999999997'$$,'42501',null,'clinician notes cannot be edited after saving');
reset role;
insert into public.ai_reports(id,patient_id,report_type,report_json,generated_by,visibility,date_range_start,date_range_end)
values('88888888-8888-4888-8888-888888888888','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','patient_history_summary','{"summary":"Fictional summary","observations":[],"questionsForClinician":[],"missingInformation":[]}'::jsonb,'22222222-2222-4222-8222-222222222222','general','2026-11-01','2026-11-20');
set local role authenticated;
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
select extensions.is((select count(*) from public.ai_reports where id='88888888-8888-4888-8888-888888888888'),1::bigint,'consented verified doctor can read patient-consented AI summaries');
select extensions.lives_ok($$insert into public.ai_report_reviews(patient_id,report_id,doctor_user_id,review_outcome,review_note) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','88888888-8888-4888-8888-888888888888','44444444-4444-4444-8444-444444444444','needs_correction','Fictional clinician review: verify the reported date with the patient.')$$,'verified doctor with patient clinical-note consent can append an AI summary review');
select extensions.is((select count(*) from public.ai_report_reviews where report_id='88888888-8888-4888-8888-888888888888'),1::bigint,'clinician review is visible to its author');
select extensions.throws_ok($$update public.ai_report_reviews set review_note='Changed review' where report_id='88888888-8888-4888-8888-888888888888'$$,'42501',null,'AI summary reviews cannot be edited after saving');
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select extensions.is((select count(*) from public.ai_report_reviews where report_id='88888888-8888-4888-8888-888888888888' and review_outcome='needs_correction'),1::bigint,'patient can read the clinician review outcome');
select extensions.is(jsonb_array_length(public.export_my_data() #> '{tables,clinical_notes}'),1,'clinical notes are included in the RLS-filtered account export');
select extensions.is(jsonb_array_length(public.export_my_data() #> '{tables,ai_report_reviews}'),1,'AI summary reviews are included in the RLS-filtered account export');
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
select extensions.throws_ok($$insert into public.health_events(patient_id,event_type,title,source,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','note','Doctor write denied','clinician','44444444-4444-4444-8444-444444444444')$$,'42501',null,'read-only doctor cannot write patient health events');
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select extensions.is((select count(*) from public.clinical_notes where id='99999999-9999-4999-8999-999999999997'),1::bigint,'linked reader can see a clinician-authored note');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select extensions.lives_ok($$update public.access_permissions set revoked_at=now() where patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and user_id='44444444-4444-4444-8444-444444444444' and permission='clinical_notes'$$,'patient can revoke only the doctor clinical-note permission');
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
select extensions.throws_ok($$insert into public.clinical_notes(patient_id,doctor_user_id,note_kind,title,body) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','44444444-4444-4444-8444-444444444444','consultation','Expired consent test','Should be rejected')$$,'42501',null,'doctor cannot append notes after note consent is revoked');
select extensions.throws_ok($$insert into public.ai_report_reviews(patient_id,report_id,doctor_user_id,review_outcome,review_note) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','88888888-8888-4888-8888-888888888888','44444444-4444-4444-8444-444444444444','reviewed','Should be rejected')$$,'42501',null,'doctor cannot append AI summary review after note consent is revoked');
select extensions.is(medvita_private.has_patient_access('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','clinical_notes'),false,'revoked note consent removes clinician-note permission');
select extensions.lives_ok($$update public.patient_relationships set status='revoked',revoked_at=now() where patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and user_id='44444444-4444-4444-8444-444444444444' and relationship_role='doctor'$$,'doctor can remove their own relationship');
select extensions.ok((select revoked_at is not null from public.access_permissions where patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and user_id='44444444-4444-4444-8444-444444444444' and permission='read'),'revoking doctor relationship also revokes patient read consent');
select extensions.ok((select revoked_at is not null from public.access_permissions where patient_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and user_id='44444444-4444-4444-8444-444444444444' and permission='clinical_notes'),'revoking doctor relationship also revokes clinical-note consent');
select extensions.is(medvita_private.has_patient_access('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','read'),false,'doctor cannot read after revoking their relationship');

reset role;
-- Raise an error if any assertion fails so `supabase db query` returns non-zero.
select * from extensions.finish(true);
rollback;
