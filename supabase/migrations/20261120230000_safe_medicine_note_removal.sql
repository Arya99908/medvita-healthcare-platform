-- Preserve schedule and dose history when an authored medicine note is removed.
alter table public.medication_schedules
  drop constraint medication_schedules_medication_id_fkey,
  add constraint medication_schedules_medication_id_fkey
    foreign key (medication_id) references public.medication_records(id) on delete restrict;

alter table public.medication_administration_logs
  drop constraint medication_administration_logs_medication_id_fkey,
  add constraint medication_administration_logs_medication_id_fkey
    foreign key (medication_id) references public.medication_records(id) on delete restrict;

drop policy if exists "linked writers can delete" on public.medication_records;
create policy "authors can remove discontinued medicine notes without history"
on public.medication_records
for delete to authenticated
using (
  medvita_private.has_patient_access(patient_id, 'write')
  and created_by = auth.uid()
  and status in ('discontinued', 'historical')
  and (visibility <> 'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
);
