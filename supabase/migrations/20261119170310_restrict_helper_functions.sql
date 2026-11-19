-- Keep SECURITY DEFINER helpers out of PostgREST's exposed public schema.
create schema if not exists medvita_private;
revoke all on schema medvita_private from public, anon, authenticated;
grant usage on schema medvita_private to authenticated;

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
      and (r.relationship_role<>'doctor' or exists (
        select 1 from public.access_permissions ap where ap.patient_id=target_patient and ap.user_id=auth.uid()
          and ap.permission=requested_permission and ap.revoked_at is null and (ap.expires_at is null or ap.expires_at>now())
      ) or requested_permission='read' and exists (
        select 1 from public.access_permissions ap where ap.patient_id=target_patient and ap.user_id=auth.uid()
          and ap.permission='read' and ap.revoked_at is null and (ap.expires_at is null or ap.expires_at>now())
      ))
  );
$$;

create or replace function medvita_private.has_sensitive_access(target_patient uuid)
returns boolean language sql stable security definer set search_path=public,auth as $$
  select exists (select 1 from public.patient_relationships r where r.patient_id=target_patient and r.user_id=auth.uid() and r.relationship_role='patient' and r.status='active')
    or exists (select 1 from public.consent_records c where c.patient_id=target_patient and c.granted_to=auth.uid()
      and c.scope='sensitive_adolescent' and c.status='active' and c.revoked_at is null and (c.expires_at is null or c.expires_at>now()));
$$;
revoke all on function medvita_private.has_patient_access(uuid,text) from public, anon;
revoke all on function medvita_private.has_sensitive_access(uuid) from public, anon;
grant execute on function medvita_private.has_patient_access(uuid,text) to authenticated;
grant execute on function medvita_private.has_sensitive_access(uuid) to authenticated;

-- Rewrite existing policies before dropping the API-exposed public helpers.
do $$
declare
  policy_row record;
  role_clause text;
  using_clause text;
  check_clause text;
  new_qual text;
  new_check text;
begin
  for policy_row in
    select * from pg_policies
    where schemaname in ('public','storage')
      and (coalesce(qual,'') like '%has_patient_access%'
        or coalesce(qual,'') like '%has_sensitive_access%'
        or coalesce(with_check,'') like '%has_patient_access%'
        or coalesce(with_check,'') like '%has_sensitive_access%')
  loop
    select string_agg(quote_ident(role_name), ', ')
      into role_clause from unnest(policy_row.roles) as roles(role_name);
    new_qual := replace(replace(policy_row.qual,'public.has_patient_access','medvita_private.has_patient_access'),'public.has_sensitive_access','medvita_private.has_sensitive_access');
    new_qual := regexp_replace(new_qual,'(^|[^[:alnum:]_.])has_patient_access[[:space:]]*\(',E'\\1medvita_private.has_patient_access(','g');
    new_qual := regexp_replace(new_qual,'(^|[^[:alnum:]_.])has_sensitive_access[[:space:]]*\(',E'\\1medvita_private.has_sensitive_access(','g');
    new_check := replace(replace(policy_row.with_check,'public.has_patient_access','medvita_private.has_patient_access'),'public.has_sensitive_access','medvita_private.has_sensitive_access');
    new_check := regexp_replace(new_check,'(^|[^[:alnum:]_.])has_patient_access[[:space:]]*\(',E'\\1medvita_private.has_patient_access(','g');
    new_check := regexp_replace(new_check,'(^|[^[:alnum:]_.])has_sensitive_access[[:space:]]*\(',E'\\1medvita_private.has_sensitive_access(','g');
    using_clause := case when new_qual is null then '' else ' USING ('||new_qual||')' end;
    check_clause := case when new_check is null then '' else ' WITH CHECK ('||new_check||')' end;

    execute format('drop policy %I on %I.%I',policy_row.policyname,policy_row.schemaname,policy_row.tablename);
    execute format('create policy %I on %I.%I as %s for %s to %s%s%s',
      policy_row.policyname,policy_row.schemaname,policy_row.tablename,policy_row.permissive,
      policy_row.cmd,role_clause,using_clause,check_clause);
  end loop;
end $$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
drop function public.has_patient_access(uuid,text);
drop function public.has_sensitive_access(uuid);
