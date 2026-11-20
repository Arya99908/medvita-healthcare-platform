create trigger record_laboratory_result_activity
  after insert or update or delete on public.laboratory_results
  for each row execute function medvita_private.record_patient_activity();
