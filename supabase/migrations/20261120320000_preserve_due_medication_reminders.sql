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

  if not schedule_found then
    update public.notifications
       set delivery_status = 'cancelled'
     where dedupe_key like 'medication-reminder:' || target_schedule::text || ':%'
       and delivery_status = 'queued';
    return;
  end if;

  if schedule_row.status <> 'active'
     or schedule_row.medication_status <> 'active'
     or not schedule_row.reminder_enabled
     or schedule_row.created_by is null
     or cardinality(schedule_row.reminder_days) = 0
     or not exists (select 1 from pg_catalog.pg_timezone_names zone where zone.name = schedule_row.reminder_timezone)
  then
    update public.notifications
       set delivery_status = 'cancelled'
     where dedupe_key like 'medication-reminder:' || target_schedule::text || ':%'
       and delivery_status = 'queued';
    return;
  end if;

  if jsonb_typeof(schedule_row.administration_times) <> 'array'
     or jsonb_array_length(schedule_row.administration_times) = 0
  then
    update public.notifications
       set delivery_status = 'cancelled'
     where dedupe_key like 'medication-reminder:' || target_schedule::text || ':%'
       and delivery_status = 'queued';
    return;
  end if;

  if exists (
    select 1 from public.notification_preferences preference
     where preference.user_id = schedule_row.created_by
       and preference.category = 'medication_reminder'
       and preference.channel = 'in_app'
       and not preference.enabled
  ) then
    update public.notifications
       set delivery_status = 'cancelled'
     where dedupe_key like 'medication-reminder:' || target_schedule::text || ':%'
       and delivery_status = 'queued';
    return;
  end if;

  update public.notifications
     set delivery_status = 'cancelled'
   where dedupe_key like 'medication-reminder:' || target_schedule::text || ':%'
     and delivery_status = 'queued'
     and scheduled_at > now();

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

revoke all on function medvita_private.refresh_medication_schedule_reminders(uuid) from public, anon, authenticated;
