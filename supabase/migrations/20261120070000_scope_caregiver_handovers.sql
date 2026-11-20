drop policy if exists "linked writers can insert" on public.caregiver_handover_records;

create policy "linked writers create authored general handovers"
on public.caregiver_handover_records
for insert
to authenticated
with check (
  medvita_private.has_patient_access(patient_id, 'write')
  and from_user_id = auth.uid()
  and visibility = 'general'
  and (
    to_user_id is null
    or (
      to_user_id <> auth.uid()
      and exists (
        select 1
        from public.patient_relationships recipient
        where recipient.patient_id = caregiver_handover_records.patient_id
          and recipient.user_id = caregiver_handover_records.to_user_id
          and recipient.status = 'active'
          and recipient.can_read
      )
    )
  )
);
