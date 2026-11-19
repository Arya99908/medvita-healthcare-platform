-- Run only against the dedicated Med-Vita project with:
-- supabase db query --linked --file supabase/tests/rls_access.test.sql
-- All fixtures are fictional and enclosed in a transaction that is rolled back.
begin;
create extension if not exists pgtap with schema extensions;

select extensions.plan(45);

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
  ('11111111-1111-4111-8111-111111111111','authenticated','authenticated','medvita-rls-patient-a@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
  ('22222222-2222-4222-8222-222222222222','authenticated','authenticated','medvita-rls-patient-b@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
  ('33333333-3333-4333-8333-333333333333','authenticated','authenticated','medvita-rls-guardian@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
  ('44444444-4444-4444-8444-444444444444','authenticated','authenticated','medvita-rls-doctor@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
  ('55555555-5555-4555-8555-555555555555','authenticated','authenticated','medvita-rls-requester@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now());

insert into public.patient_profiles(id,created_by,display_name,life_stage)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Fictional adolescent A','adolescent'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','Fictional patient B','adult');

insert into public.patient_sharing_sessions(patient_id,created_by,token_hash,expires_at)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','fictional-sharing-token-hash',now()+interval '1 hour');

insert into public.patient_relationships(patient_id,user_id,relationship_role,can_read,can_write,status,created_by)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','patient',true,true,'active','11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','patient',true,true,'active','22222222-2222-4222-8222-222222222222'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','33333333-3333-4333-8333-333333333333','guardian',true,false,'active','11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444','doctor',true,true,'active','11111111-1111-4111-8111-111111111111');

insert into public.access_permissions(patient_id,user_id,permission,granted_by)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444','read','11111111-1111-4111-8111-111111111111');

insert into public.health_events(patient_id,event_type,title,source,visibility,created_by)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','note','Fictional general event','patient','general','11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','note','Fictional sensitive event','patient','sensitive_adolescent','11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','note','Other fictional patient event','patient','general','22222222-2222-4222-8222-222222222222');

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
select extensions.is(jsonb_array_length(current_setting('medvita.test_export')::jsonb #> '{tables,patient_sharing_sessions}'),1,'export includes the caller-visible sharing session');
select extensions.is(coalesce(((current_setting('medvita.test_export')::jsonb #> '{tables,patient_sharing_sessions,0}') ? 'token_hash'),false),false,'export omits the sharing token hash');
select extensions.is(current_setting('medvita.test_export')::jsonb #>> '{account_id}','11111111-1111-4111-8111-111111111111','export identifies the authenticated account');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select extensions.is((select count(*) from public.health_events where patient_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and visibility='general'),1::bigint,'guardian can read linked general event');
select extensions.is((select count(*) from public.health_events where patient_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and visibility='sensitive_adolescent'),0::bigint,'guardian cannot read sensitive adolescent event without consent');

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
select extensions.lives_ok($$insert into public.appointments(id,patient_id,title,starts_at,created_by) values('ffffffff-ffff-4fff-8fff-ffffffffffff','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Fictional authorized appointment','2026-11-21 03:30:00+00','11111111-1111-4111-8111-111111111111')$$,'patient with active write access can add an own-profile appointment');
select extensions.throws_ok($$insert into public.appointments(patient_id,title,starts_at,created_by) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fictional unauthorized appointment','2026-11-21 03:30:00+00','11111111-1111-4111-8111-111111111111')$$,'42501',null,'patient cannot add an appointment to another patient profile');
select extensions.lives_ok($$update public.appointments set status='completed' where id='ffffffff-ffff-4fff-8fff-ffffffffffff'$$,'patient with active write access can update own appointment plan');
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
-- Raise an error if any assertion fails so `supabase db query` returns non-zero.
select * from extensions.finish(true);
rollback;
