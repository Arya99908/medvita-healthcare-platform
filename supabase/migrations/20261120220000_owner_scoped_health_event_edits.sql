-- A linked writer may correct or remove only their own unverified timeline notes.
-- Preserve existing insert/read policies and keep verified entries immutable.
drop policy if exists "linked writers can update" on public.health_events;
create policy "authors can update own unverified timeline notes"
on public.health_events for update to authenticated
using (
  medvita_private.has_patient_access(patient_id, 'write')
  and created_by = auth.uid()
  and verification_status = 'unverified'
)
with check (
  medvita_private.has_patient_access(patient_id, 'write')
  and created_by = auth.uid()
  and verification_status = 'unverified'
);

drop policy if exists "linked writers can delete" on public.health_events;
create policy "authors can delete own unverified timeline notes"
on public.health_events for delete to authenticated
using (
  medvita_private.has_patient_access(patient_id, 'write')
  and created_by = auth.uid()
  and verification_status = 'unverified'
);
