-- Keep the admin audit view limited to doctor-verification decisions.
create policy "platform admins read doctor review audit history" on public.audit_logs
  for select to authenticated using (
    resource_type = 'doctor'
    and action in ('doctor_application_verified', 'doctor_application_rejected')
    and exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'platform_admin'
    )
  );
