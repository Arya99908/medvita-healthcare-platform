create extension if not exists pg_cron with schema pg_catalog;

create or replace function medvita_private.refresh_appointment_reminder(target_appointment uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  appointment_row record;
begin
  select id, patient_id, created_by, starts_at, status
    into appointment_row
    from public.appointments
   where id = target_appointment;

  if not found then
    update public.notifications
       set delivery_status = 'cancelled'
     where dedupe_key like 'appointment-reminder:' || target_appointment::text || ':%'
       and delivery_status = 'queued';
    return;
  end if;

  update public.notifications
     set delivery_status = 'cancelled'
   where dedupe_key like 'appointment-reminder:' || target_appointment::text || ':%'
     and delivery_status = 'queued';

  if appointment_row.status <> 'scheduled' or appointment_row.starts_at <= now() then
    return;
  end if;

  if exists (
    select 1 from public.notification_preferences preference
     where preference.user_id = appointment_row.created_by
       and preference.category = 'appointment_reminder'
       and preference.channel = 'in_app'
       and not preference.enabled
  ) then
    return;
  end if;

  insert into public.notifications(
    patient_id, user_id, category, title, message, scheduled_at, delivery_status, visibility, dedupe_key
  ) values (
    appointment_row.patient_id,
    appointment_row.created_by,
    'appointment_reminder',
    'Upcoming health event',
    'You have a health event coming up in about 24 hours. Sign in to view your care calendar.',
    greatest(now(), appointment_row.starts_at - interval '24 hours'),
    'queued',
    'general',
    'appointment-reminder:' || appointment_row.id::text || ':' || extract(epoch from appointment_row.starts_at)::bigint::text
  ) on conflict (dedupe_key) do nothing;
end;
$$;

create or replace function medvita_private.sync_appointment_reminder()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform medvita_private.refresh_appointment_reminder(old.id);
    return old;
  end if;

  perform medvita_private.refresh_appointment_reminder(new.id);
  return new;
end;
$$;

create trigger sync_appointment_reminder
after insert or update of starts_at, status or delete on public.appointments
for each row execute function medvita_private.sync_appointment_reminder();

create or replace function medvita_private.sync_user_appointment_reminders()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid;
  target_category text;
  target_channel text;
  appointment_id uuid;
begin
  if tg_op = 'DELETE' then
    target_user := old.user_id;
    target_category := old.category;
    target_channel := old.channel;
  else
    target_user := new.user_id;
    target_category := new.category;
    target_channel := new.channel;
  end if;

  if target_category <> 'appointment_reminder' or target_channel <> 'in_app' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  for appointment_id in
    select appointment.id from public.appointments appointment
     where appointment.created_by = target_user and appointment.status = 'scheduled' and appointment.starts_at > now()
  loop
    perform medvita_private.refresh_appointment_reminder(appointment_id);
  end loop;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger sync_user_appointment_reminders
after insert or update or delete on public.notification_preferences
for each row execute function medvita_private.sync_user_appointment_reminders();

create or replace function medvita_private.release_due_appointment_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  released_count integer;
begin
  update public.notifications notification
     set delivery_status = case
           when exists (
             select 1 from public.notification_preferences preference
              where preference.user_id = notification.user_id
                and preference.category = 'appointment_reminder'
                and preference.channel = 'in_app'
                and not preference.enabled
           ) then 'cancelled'
           else 'sent'
         end,
         sent_at = case
           when exists (
             select 1 from public.notification_preferences preference
              where preference.user_id = notification.user_id
                and preference.category = 'appointment_reminder'
                and preference.channel = 'in_app'
                and not preference.enabled
           ) then null
           else now()
         end
   where notification.category = 'appointment_reminder'
     and notification.delivery_status = 'queued'
     and notification.scheduled_at <= now();

  get diagnostics released_count = row_count;
  return released_count;
end;
$$;

revoke all on function medvita_private.refresh_appointment_reminder(uuid) from public, anon, authenticated;
revoke all on function medvita_private.sync_appointment_reminder() from public, anon, authenticated;
revoke all on function medvita_private.sync_user_appointment_reminders() from public, anon, authenticated;
revoke all on function medvita_private.release_due_appointment_reminders() from public, anon, authenticated;

select cron.schedule(
  'medvita-release-appointment-reminders',
  '* * * * *',
  'select medvita_private.release_due_appointment_reminders();'
);
