alter table public.caregiver_tasks drop constraint caregiver_tasks_status_check;
alter table public.caregiver_tasks add constraint caregiver_tasks_status_check
  check (status in ('open','complete','missed','cancelled'));

drop policy if exists "assignee or task creator can update care task" on public.caregiver_tasks;
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
  and (status <> 'missed' or due_at <= statement_timestamp())
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
