alter table public.notifications add column dedupe_key text unique;

create or replace function medvita_private.notify_care_task_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  task_visibility text;
begin
  if new.assigned_to is null then return new; end if;
  if tg_op = 'UPDATE' and new.assigned_to is not distinct from old.assigned_to then return new; end if;
  if new.assigned_to = auth.uid() then return new; end if;

  task_visibility := case when new.visibility = 'sensitive_adolescent' then 'sensitive_adolescent' else 'general' end;

  if not exists (
    select 1 from public.patient_relationships relationship
    where relationship.patient_id = new.patient_id
      and relationship.user_id = new.assigned_to
      and relationship.status = 'active'
      and relationship.can_read and relationship.can_write
      and relationship.relationship_role in ('caregiver','family_member','guardian','nurse')
  ) then return new; end if;
  if task_visibility = 'sensitive_adolescent'
     and not exists (
       select 1 from public.patient_relationships patient_link
       where patient_link.patient_id = new.patient_id
         and patient_link.user_id = new.assigned_to
         and patient_link.relationship_role = 'patient'
         and patient_link.status = 'active'
     )
     and not exists (
       select 1 from public.consent_records consent
       where consent.patient_id = new.patient_id
         and consent.granted_to = new.assigned_to
         and consent.scope = 'sensitive_adolescent'
         and consent.status = 'active' and consent.revoked_at is null
         and (consent.expires_at is null or consent.expires_at > now())
     ) then return new; end if;
  if exists (
    select 1 from public.notification_preferences preference
    where preference.user_id = new.assigned_to
      and preference.category = 'caregiver_task'
      and preference.channel = 'in_app'
      and not preference.enabled
  ) then return new; end if;

  insert into public.notifications(
    patient_id, user_id, category, title, message, scheduled_at, sent_at, delivery_status, visibility, dedupe_key
  ) values (
    new.patient_id,
    new.assigned_to,
    'caregiver_task',
    'A care task was assigned to you',
    'Sign in to review the task in your MedVita care list.',
    now(), now(), 'sent', task_visibility,
    'care-task-assigned:' || new.id::text || ':' || new.assigned_to::text
  ) on conflict (dedupe_key) do nothing;

  return new;
end;
$$;

revoke all on function medvita_private.notify_care_task_assignee() from public, anon, authenticated;

create trigger notify_care_task_assignee
after insert or update on public.caregiver_tasks
for each row execute function medvita_private.notify_care_task_assignee();
