drop policy if exists "linked writers can update" on public.medication_records;

create policy "medicine authors update own notes"
on public.medication_records
for update
to authenticated
using (
  medvita_private.has_patient_access(patient_id, 'write')
  and created_by = auth.uid()
  and (visibility <> 'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
)
with check (
  medvita_private.has_patient_access(patient_id, 'write')
  and created_by = auth.uid()
  and (visibility <> 'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
);
