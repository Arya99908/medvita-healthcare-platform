alter table public.medication_schedules
  add column reminder_timezone text not null default 'UTC',
  add column reminder_days smallint[] not null default array[0,1,2,3,4,5,6]::smallint[],
  add constraint medication_schedules_reminder_days_check
    check (cardinality(reminder_days) > 0 and reminder_days <@ array[0,1,2,3,4,5,6]::smallint[]);

create or replace function medvita_private.refresh_medication_schedule_reminders(target_schedule uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  schedule_row record;
  local_today date;
  reminder_day date;
  reminder_time text;
  reminder_at timestamptz;
  schedule_found boolean;
begin
  select schedule.id, schedule.patient_id, schedule.medication_id, schedule.created_by,
         schedule.administration_times, schedule.reminder_enabled, schedule.reminder_days,
         schedule.reminder_timezone, schedule.starts_on, schedule.ends_on, schedule.status,
         schedule.visibility, medication.status as medication_status
    into schedule_row
    from public.medication_schedules schedule
    join public.medication_records medication
      on medication.id = schedule.medication_id and medication.patient_id = schedule.patient_id
   where schedule.id = target_schedule;
  schedule_found := found;

  update public.notifications
     set delivery_status = 'cancelled'
   where dedupe_key like 'medication-reminder:' || target_schedule::text || ':%'
     and delivery_status = 'queued';

  if not schedule_found then
    return;
  end if;

  if schedule_row.status <> 'active'
     or schedule_row.medication_status <> 'active'
     or not schedule_row.reminder_enabled
     or schedule_row.created_by is null
     or cardinality(schedule_row.reminder_days) = 0
     or not exists (select 1 from pg_catalog.pg_timezone_names zone where zone.name = schedule_row.reminder_timezone)
  then
    return;
  end if;

  if jsonb_typeof(schedule_row.administration_times) <> 'array'
     or jsonb_array_length(schedule_row.administration_times) = 0
  then
    return;
  end if;

  if exists (
    select 1 from public.notification_preferences preference
     where preference.user_id = schedule_row.created_by
       and preference.category = 'medication_reminder'
       and preference.channel = 'in_app'
       and not preference.enabled
  ) then
    return;
  end if;

  local_today := (now() at time zone schedule_row.reminder_timezone)::date;
  for reminder_day in
    select local_today + day_offset.days from generate_series(0, 7) as day_offset(days)
  loop
    if (schedule_row.starts_on is not null and reminder_day < schedule_row.starts_on)
       or (schedule_row.ends_on is not null and reminder_day > schedule_row.ends_on)
       or not (extract(dow from reminder_day)::smallint = any(schedule_row.reminder_days))
    then
      continue;
    end if;

    for reminder_time in
      select jsonb_array_elements_text(schedule_row.administration_times)
    loop
      if reminder_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
        continue;
      end if;

      reminder_at := (reminder_day::text || ' ' || reminder_time)::timestamp at time zone schedule_row.reminder_timezone;
      if reminder_at <= now() then
        continue;
      end if;

      insert into public.notifications(
        patient_id, user_id, category, title, message, scheduled_at,
        delivery_status, visibility, dedupe_key
      ) values (
        schedule_row.patient_id,
        schedule_row.created_by,
        'medication_reminder',
        'Medication schedule reminder',
        'Check the medication instructions recorded for this time. Record what happened in MedVita if helpful.',
        reminder_at,
        'queued',
        schedule_row.visibility,
        'medication-reminder:' || target_schedule::text || ':' || reminder_day::text || ':' || reminder_time
      ) on conflict (dedupe_key) do update
          set delivery_status = 'queued',
              scheduled_at = excluded.scheduled_at,
              sent_at = null,
              read_at = null
        where public.notifications.delivery_status = 'cancelled';
    end loop;
  end loop;
end;
$$;

create or replace function medvita_private.sync_medication_schedule_reminders()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform medvita_private.refresh_medication_schedule_reminders(old.id);
    return old;
  end if;

  perform medvita_private.refresh_medication_schedule_reminders(new.id);
  return new;
end;
$$;

create trigger sync_medication_schedule_reminders
after insert or update or delete on public.medication_schedules
for each row execute function medvita_private.sync_medication_schedule_reminders();

create or replace function medvita_private.sync_user_medication_reminders()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid;
  target_category text;
  target_channel text;
  schedule_id uuid;
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

  if target_category <> 'medication_reminder' or target_channel <> 'in_app' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  for schedule_id in
    select schedule.id
      from public.medication_schedules schedule
     where schedule.created_by = target_user and schedule.status = 'active' and schedule.reminder_enabled
  loop
    perform medvita_private.refresh_medication_schedule_reminders(schedule_id);
  end loop;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger sync_user_medication_reminders
after insert or update or delete on public.notification_preferences
for each row execute function medvita_private.sync_user_medication_reminders();

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
     set delivery_status = case
           when exists (
             select 1 from public.notification_preferences preference
              where preference.user_id = notification.user_id
                and preference.category = notification.category
                and preference.channel = 'in_app'
                and not preference.enabled
           ) then 'cancelled'
           else 'sent'
         end,
         sent_at = case
           when exists (
             select 1 from public.notification_preferences preference
              where preference.user_id = notification.user_id
                and preference.category = notification.category
                and preference.channel = 'in_app'
                and not preference.enabled
           ) then null
           else now()
         end
   where notification.category in ('appointment_reminder','medication_reminder')
     and notification.delivery_status = 'queued'
     and notification.scheduled_at <= now();

  get diagnostics released_count = row_count;
  return released_count;
end;
$$;

create or replace function medvita_private.schedule_due_medication_reminders()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  schedule_id uuid;
begin
  for schedule_id in
    select schedule.id
      from public.medication_schedules schedule
      join public.medication_records medication
        on medication.id = schedule.medication_id and medication.patient_id = schedule.patient_id
     where schedule.status = 'active'
       and schedule.reminder_enabled
       and medication.status = 'active'
       and case when jsonb_typeof(schedule.administration_times) = 'array' then jsonb_array_length(schedule.administration_times) > 0 else false end
  loop
    perform medvita_private.refresh_medication_schedule_reminders(schedule_id);
  end loop;
end;
$$;

revoke all on function medvita_private.refresh_medication_schedule_reminders(uuid) from public, anon, authenticated;
revoke all on function medvita_private.sync_medication_schedule_reminders() from public, anon, authenticated;
revoke all on function medvita_private.sync_user_medication_reminders() from public, anon, authenticated;
revoke all on function medvita_private.release_due_appointment_reminders() from public, anon, authenticated;
revoke all on function medvita_private.schedule_due_medication_reminders() from public, anon, authenticated;
