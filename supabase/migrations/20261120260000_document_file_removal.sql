-- Preserve a minimal tombstone and audit record while removing the private object and OCR text.
alter table public.medical_documents
  add column deleted_at timestamptz,
  add column deleted_by uuid references auth.users(id) on delete set null;

create function medvita_private.guard_medical_document_deletion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.upload_status = 'deleted' and new.upload_status <> 'deleted' then
    raise exception 'Removed documents cannot be restored' using errcode = '42501';
  end if;
  if old.upload_status <> 'deleted' and new.upload_status = 'deleted' then
    if not medvita_private.has_patient_access(old.patient_id, 'write') then
      raise exception 'Active write access is required' using errcode = '42501';
    end if;
    if old.uploaded_by is distinct from auth.uid()
      and not exists (select 1 from public.patient_profiles p where p.id = old.patient_id and p.created_by = auth.uid())
      and not exists (select 1 from public.patient_relationships r where r.patient_id = old.patient_id and r.user_id = auth.uid() and r.relationship_role = 'patient' and r.status = 'active') then
      raise exception 'Only the uploader or patient can remove this file' using errcode = '42501';
    end if;
    new.deleted_at := now();
    new.deleted_by := auth.uid();
    insert into public.audit_logs(actor_user_id, patient_id, action, resource_type, resource_id, metadata)
      values (auth.uid(), old.patient_id, 'document_file_removed', 'medical_document', old.id,
        jsonb_build_object('document_type', old.document_type, 'storage_file_removed', true));
  end if;
  return new;
end;
$$;
revoke all on function medvita_private.guard_medical_document_deletion() from public, anon, authenticated;

create trigger guard_medical_document_deletion
  before update of upload_status on public.medical_documents
  for each row execute function medvita_private.guard_medical_document_deletion();

drop policy "linked writers can delete medical files" on storage.objects;
create policy "uploader or patient can remove medical files" on storage.objects
  for delete to authenticated using (
    bucket_id = 'medical-documents'
    and ((storage.foldername(name))[2] is null or (storage.foldername(name))[2] in ('general','sensitive_adolescent'))
    and medvita_private.has_patient_access(((storage.foldername(name))[1])::uuid, 'manage_documents')
    and ((storage.foldername(name))[2] is distinct from 'sensitive_adolescent' or medvita_private.has_sensitive_access(((storage.foldername(name))[1])::uuid))
    and exists (
      select 1 from public.medical_documents d
      join public.patient_profiles p on p.id = d.patient_id
      where d.storage_path = name and d.upload_status <> 'deleted'
        and (d.uploaded_by = auth.uid() or p.created_by = auth.uid() or exists (
          select 1 from public.patient_relationships r
          where r.patient_id = d.patient_id and r.user_id = auth.uid() and r.relationship_role = 'patient' and r.status = 'active'
        ))
    )
  );
