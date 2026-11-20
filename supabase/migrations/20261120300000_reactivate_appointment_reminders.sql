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
  ) on conflict (dedupe_key) do update
      set delivery_status = 'queued',
          scheduled_at = excluded.scheduled_at,
          sent_at = null,
          read_at = null
    where public.notifications.delivery_status = 'cancelled';
end;
$$;

revoke all on function medvita_private.refresh_appointment_reminder(uuid) from public, anon, authenticated;
