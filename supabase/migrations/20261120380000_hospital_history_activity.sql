create trigger record_hospital_visit_activity
  after insert or update or delete on public.hospital_visits
  for each row execute function medvita_private.record_patient_activity();

create trigger record_hospital_admission_activity
  after insert or update or delete on public.hospital_admissions
  for each row execute function medvita_private.record_patient_activity();
