alter table public.vaccination_records
  add column reminder_enabled boolean not null default false,
  add column reminder_timezone text not null default 'UTC';

create or replace function medvita_private.refresh_vaccination_reminder(target_record uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  vaccine record;
  reminder_at timestamptz;
begin
  update public.notifications
     set delivery_status = 'cancelled'
   where dedupe_key like 'vaccination-reminder:' || target_record::text || ':%'
     and delivery_status = 'queued';

  select id, patient_id, created_by, status, due_on, reminder_enabled, reminder_timezone
    into vaccine
    from public.vaccination_records
   where id = target_record;
  if not found then return; end if;
  if vaccine.status <> 'planned' or vaccine.due_on is null
     or not vaccine.reminder_enabled or vaccine.created_by is null
     or not exists (select 1 from pg_catalog.pg_timezone_names zone where zone.name = vaccine.reminder_timezone)
     or exists (
       select 1 from public.notification_preferences preference
        where preference.user_id = vaccine.created_by
          and preference.category = 'vaccination_reminder'
          and preference.channel = 'in_app'
          and not preference.enabled
     ) then
    return;
  end if;

  reminder_at := (vaccine.due_on::text || ' 09:00')::timestamp at time zone vaccine.reminder_timezone;
  if reminder_at <= now() then return; end if;

  insert into public.notifications(
    patient_id, user_id, category, title, message, scheduled_at,
    delivery_status, visibility, dedupe_key
  ) values (
    vaccine.patient_id, vaccine.created_by, 'vaccination_reminder',
    'Vaccination date reminder',
    'A vaccination date you entered is coming up. Check the child profile for details.',
    reminder_at, 'queued', 'general',
    'vaccination-reminder:' || target_record::text || ':' || vaccine.due_on::text
  ) on conflict (dedupe_key) do update
      set delivery_status = 'queued', scheduled_at = excluded.scheduled_at,
          sent_at = null, read_at = null
    where public.notifications.delivery_status = 'cancelled';
end;
$$;

create or replace function medvita_private.sync_vaccination_reminder()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform medvita_private.refresh_vaccination_reminder(old.id);
    return old;
  end if;
  perform medvita_private.refresh_vaccination_reminder(new.id);
  return new;
end;
$$;

create trigger sync_vaccination_reminder
after insert or update or delete on public.vaccination_records
for each row execute function medvita_private.sync_vaccination_reminder();

create or replace function medvita_private.sync_user_vaccination_reminders()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid;
  target_category text;
  target_channel text;
  record_id uuid;
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
  if target_category <> 'vaccination_reminder' or target_channel <> 'in_app' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  for record_id in
    select vaccination.id from public.vaccination_records vaccination
     where vaccination.created_by = target_user and vaccination.reminder_enabled
  loop
    perform medvita_private.refresh_vaccination_reminder(record_id);
  end loop;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger sync_user_vaccination_reminders
after insert or update or delete on public.notification_preferences
for each row execute function medvita_private.sync_user_vaccination_reminders();

create or replace function medvita_private.release_due_appointment_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  released_count integer;
begin
  perform medvita_private.schedule_due_medication_reminders();
  update public.notifications notification
     set delivery_status = case when exists (
           select 1 from public.notification_preferences preference
            where preference.user_id = notification.user_id
              and preference.category = notification.category
              and preference.channel = 'in_app'
              and not preference.enabled
         ) then 'cancelled' else 'sent' end,
         sent_at = case when exists (
           select 1 from public.notification_preferences preference
            where preference.user_id = notification.user_id
              and preference.category = notification.category
              and preference.channel = 'in_app'
              and not preference.enabled
         ) then null else now() end
   where notification.category in ('appointment_reminder','medication_reminder','vaccination_reminder')
     and notification.delivery_status = 'queued'
     and notification.scheduled_at <= now();
  get diagnostics released_count = row_count;
  return released_count;
end;
$$;

revoke all on function medvita_private.refresh_vaccination_reminder(uuid) from public, anon, authenticated;
revoke all on function medvita_private.sync_vaccination_reminder() from public, anon, authenticated;
revoke all on function medvita_private.sync_user_vaccination_reminders() from public, anon, authenticated;
revoke all on function medvita_private.release_due_appointment_reminders() from public, anon, authenticated;
