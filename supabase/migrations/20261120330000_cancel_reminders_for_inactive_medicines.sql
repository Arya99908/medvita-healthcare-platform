create or replace function medvita_private.sync_medication_record_reminders()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_medication uuid := case when tg_op = 'DELETE' then old.id else new.id end;
  schedule_id uuid;
begin
  for schedule_id in
    select schedule.id
      from public.medication_schedules schedule
     where schedule.medication_id = target_medication
  loop
    perform medvita_private.refresh_medication_schedule_reminders(schedule_id);
  end loop;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger sync_medication_record_reminders
after update of status or delete on public.medication_records
for each row execute function medvita_private.sync_medication_record_reminders();

revoke all on function medvita_private.sync_medication_record_reminders() from public, anon, authenticated;
