alter table public.appointments
  add column event_type text not null default 'doctor_appointment'
    check (event_type in (
      'doctor_appointment','hospital_visit','hospital_admission','discharge_date',
      'laboratory_test','imaging','vaccination','follow_up','medication_refill',
      'exercise','meal','wellness_goal','caregiver_visit','home_nursing',
      'procedure','therapy','general'
    )),
  add column notes text;

create index appointments_patient_type_date_idx
  on public.appointments(patient_id,event_type,starts_at);
