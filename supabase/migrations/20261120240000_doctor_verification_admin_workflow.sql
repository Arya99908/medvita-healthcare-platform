-- Private credential submissions and an audited, platform-admin-only review path.
create table public.doctor_verification_submissions (
  doctor_id uuid primary key references public.doctors(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  registration_number text not null check (length(trim(registration_number)) between 2 and 80),
  issuing_jurisdiction text not null check (length(trim(issuing_jurisdiction)) between 2 and 120),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index doctor_verification_submissions_user_idx on public.doctor_verification_submissions(user_id);
alter table public.doctor_verification_submissions enable row level security;

create policy "doctor owns own verification submission" on public.doctor_verification_submissions
  for select to authenticated using (user_id = auth.uid());
create policy "platform admins read doctor verification submissions" on public.doctor_verification_submissions
  for select to authenticated using (
    exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'platform_admin')
  );
create policy "doctor submits own verification details" on public.doctor_verification_submissions
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.doctors d where d.id = doctor_id and d.user_id = auth.uid() and d.verification_status <> 'verified')
  );
create policy "doctor updates own unverified submission" on public.doctor_verification_submissions
  for update to authenticated using (
    user_id = auth.uid()
    and exists (select 1 from public.doctors d where d.id = doctor_id and d.user_id = auth.uid() and d.verification_status <> 'verified')
  ) with check (
    user_id = auth.uid()
    and exists (select 1 from public.doctors d where d.id = doctor_id and d.user_id = auth.uid() and d.verification_status <> 'verified')
  );

grant select, insert, update on public.doctor_verification_submissions to authenticated;
revoke all on public.doctor_verification_submissions from anon;

create policy "platform admins review doctor profiles" on public.doctors
  for select to authenticated using (
    exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'platform_admin')
  );

create function medvita_private.review_doctor_application(
  p_doctor_id uuid,
  p_decision text,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_reason text := nullif(trim(p_reason), '');
begin
  if not exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'platform_admin'
  ) then
    raise exception 'Platform administrator role required' using errcode = '42501';
  end if;
  if p_decision not in ('verified', 'rejected') then
    raise exception 'Decision must be verified or rejected' using errcode = '22023';
  end if;
  if p_decision = 'rejected' and v_reason is null then
    raise exception 'A reason is required when rejecting an application' using errcode = '22023';
  end if;

  select d.user_id into v_user_id
  from public.doctors d
  join public.doctor_verification_submissions s on s.doctor_id = d.id
  where d.id = p_doctor_id and d.verification_status <> 'verified';
  if not found then
    raise exception 'Pending application not found' using errcode = 'P0002';
  end if;

  update public.doctors set verification_status = p_decision, updated_at = now()
  where id = p_doctor_id;
  insert into public.audit_logs(actor_user_id, action, resource_type, resource_id, metadata)
  values (
    auth.uid(), 'doctor_application_' || p_decision, 'doctor', p_doctor_id,
    jsonb_build_object('decision', p_decision, 'reason', v_reason, 'applicant_user_id', v_user_id)
  );
  return true;
end;
$$;

revoke all on function medvita_private.review_doctor_application(uuid, text, text) from public, anon;
grant execute on function medvita_private.review_doctor_application(uuid, text, text) to authenticated;

create function public.review_doctor_application(p_doctor_id uuid, p_decision text, p_reason text default null)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select medvita_private.review_doctor_application($1, $2, $3);
$$;
revoke all on function public.review_doctor_application(uuid, text, text) from public, anon;
grant execute on function public.review_doctor_application(uuid, text, text) to authenticated;
