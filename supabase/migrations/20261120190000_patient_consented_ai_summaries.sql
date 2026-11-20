-- AI summaries may include patient health data sent to an external model.
-- Only the patient account may create this one-time consent, targeted to itself.
drop policy "patient manages consent" on public.consent_records;
create policy "patient manages consent" on public.consent_records for all to authenticated
  using(medvita_private.has_patient_access(patient_id,'write'))
  with check(
    medvita_private.has_patient_access(patient_id,'write')
    and granted_by=auth.uid()
    and (scope not in ('sensitive_adolescent','ai_summary') or exists(
      select 1 from public.patient_relationships r
      where r.patient_id=patient_id and r.user_id=auth.uid() and r.relationship_role='patient' and r.status='active'
    ))
    and (scope<>'ai_summary' or granted_to=auth.uid())
  );

comment on policy "patient manages consent" on public.consent_records is
  'Patient-created consent only for sensitive adolescent access and one-time AI processing. AI consent must be granted to the patient account and has a short expiry.';
