-- Requiring patient consent is not enough when anyone can self-register a
-- doctor profile. Keep every doctor record read behind verified status too.
create or replace function medvita_private.has_patient_access(target_patient uuid, requested_permission text default 'read')
returns boolean language sql stable security definer set search_path=public,auth as $$
  select exists (
    select 1 from public.patient_relationships r
    where r.patient_id=target_patient and r.user_id=auth.uid() and r.status='active'
      and case requested_permission
        when 'read' then r.can_read
        when 'write' then r.can_write
        when 'manage_documents' then r.can_write
        when 'manage_care' then r.can_write
        else false
      end
      and (r.relationship_role<>'doctor' or (
        exists (select 1 from public.doctors d where d.user_id=auth.uid() and d.verification_status='verified')
        and exists (
          select 1 from public.access_permissions ap where ap.patient_id=target_patient and ap.user_id=auth.uid()
            and ap.permission=requested_permission and ap.revoked_at is null and (ap.expires_at is null or ap.expires_at>now())
        )
      ))
  );
$$;
