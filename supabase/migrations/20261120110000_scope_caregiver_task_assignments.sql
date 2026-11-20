drop policy if exists "linked writers can insert" on public.caregiver_tasks;
drop policy if exists "linked writers can update" on public.caregiver_tasks;

create policy "writers assign tasks to the care team"
on public.caregiver_tasks for insert to authenticated
with check (
  medvita_private.has_patient_access(patient_id, 'write')
  and (created_by is null or created_by = auth.uid())
  and (visibility = 'general' or medvita_private.has_sensitive_access(patient_id))
  and (
    assigned_to is null
    or assigned_to = auth.uid()
    or exists (
      select 1 from public.patient_relationships assignee
      where assignee.patient_id = caregiver_tasks.patient_id
        and assignee.user_id = caregiver_tasks.assigned_to
        and assignee.status = 'active'
        and assignee.can_read and assignee.can_write
        and assignee.relationship_role in ('caregiver','family_member','guardian','nurse')
    )
  )
);

create policy "assignee or task creator can update care task"
on public.caregiver_tasks for update to authenticated
using (
  medvita_private.has_patient_access(patient_id, 'write')
  and (assigned_to = auth.uid() or created_by = auth.uid())
  and (visibility = 'general' or medvita_private.has_sensitive_access(patient_id))
)
with check (
  medvita_private.has_patient_access(patient_id, 'write')
  and (assigned_to = auth.uid() or created_by = auth.uid())
  and (visibility = 'general' or medvita_private.has_sensitive_access(patient_id))
  and (
    assigned_to is null
    or assigned_to = auth.uid()
    or exists (
      select 1 from public.patient_relationships assignee
      where assignee.patient_id = caregiver_tasks.patient_id
        and assignee.user_id = caregiver_tasks.assigned_to
        and assignee.status = 'active'
        and assignee.can_read and assignee.can_write
        and assignee.relationship_role in ('caregiver','family_member','guardian','nurse')
    )
  )
);
