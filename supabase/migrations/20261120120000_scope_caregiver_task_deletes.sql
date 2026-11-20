drop policy if exists "linked writers can delete" on public.caregiver_tasks;

create policy "assignee or task creator can delete care task"
on public.caregiver_tasks for delete to authenticated
using (
  medvita_private.has_patient_access(patient_id, 'write')
  and (assigned_to = auth.uid() or created_by = auth.uid())
  and (visibility = 'general' or medvita_private.has_sensitive_access(patient_id))
);
