-- Restrict structured timeline corrections to the author of an unverified row.
-- The application repeats these checks, but RLS must enforce them for direct API calls too.

drop policy if exists "linked writers can update" on public.medical_conditions;
drop policy if exists "linked writers can delete" on public.medical_conditions;
create policy "authors can update own unverified conditions" on public.medical_conditions
  for update to authenticated using (
    medvita_private.has_patient_access(patient_id,'write')
    and created_by=auth.uid() and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('adult','senior'))
  ) with check (
    medvita_private.has_patient_access(patient_id,'write')
    and created_by=auth.uid() and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('adult','senior'))
  );
create policy "authors can delete own unverified conditions" on public.medical_conditions
  for delete to authenticated using (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid()
    and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('adult','senior'))
  );

drop policy if exists "linked writers can update" on public.symptom_observations;
drop policy if exists "linked writers can delete" on public.symptom_observations;
create policy "authors can update own symptoms" on public.symptom_observations
  for update to authenticated using (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid()
    and (visibility<>'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
  ) with check (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid()
    and (visibility<>'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
  );
create policy "authors can delete own symptoms" on public.symptom_observations
  for delete to authenticated using (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid()
    and (visibility<>'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
  );

-- These generic tables only hold the child-care entries surfaced in the child profile.
do $$ declare tbl text; begin
  foreach tbl in array array['feeding_records','bowel_movement_records','vomiting_records','growth_records'] loop
    execute format('drop policy if exists %I on public.%I','linked writers can update',tbl);
    execute format('drop policy if exists %I on public.%I','linked writers can delete',tbl);
    execute format('create policy %I on public.%I for update to authenticated using (
      medvita_private.has_patient_access(patient_id,''write'') and created_by=auth.uid()
      and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in (''infant'',''child''))
    ) with check (
      medvita_private.has_patient_access(patient_id,''write'') and created_by=auth.uid()
      and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in (''infant'',''child''))
    )','authors can update own child-care rows',tbl);
    execute format('create policy %I on public.%I for delete to authenticated using (
      medvita_private.has_patient_access(patient_id,''write'') and created_by=auth.uid()
      and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in (''infant'',''child''))
    )','authors can delete own child-care rows',tbl);
  end loop;
end $$;

drop policy if exists "linked writers can update" on public.menstrual_records;
drop policy if exists "linked writers can delete" on public.menstrual_records;
create policy "patients can update own cycle notes" on public.menstrual_records
  for update to authenticated using (
    medvita_private.has_patient_access(patient_id,'write') and medvita_private.has_sensitive_access(patient_id)
    and created_by=auth.uid()
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage='adolescent')
    and exists(select 1 from public.patient_relationships r where r.patient_id=patient_id and r.user_id=auth.uid() and r.status='active' and r.relationship_role='patient')
  ) with check (
    medvita_private.has_patient_access(patient_id,'write') and medvita_private.has_sensitive_access(patient_id)
    and created_by=auth.uid()
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage='adolescent')
    and exists(select 1 from public.patient_relationships r where r.patient_id=patient_id and r.user_id=auth.uid() and r.status='active' and r.relationship_role='patient')
  );
create policy "patients can delete own cycle notes" on public.menstrual_records
  for delete to authenticated using (
    medvita_private.has_patient_access(patient_id,'write') and medvita_private.has_sensitive_access(patient_id)
    and created_by=auth.uid()
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage='adolescent')
    and exists(select 1 from public.patient_relationships r where r.patient_id=patient_id and r.user_id=auth.uid() and r.status='active' and r.relationship_role='patient')
  );

drop policy if exists "linked writers can update child urination logs" on public.urination_records;
drop policy if exists "linked writers can delete child urination logs" on public.urination_records;
create policy "authors can update own unverified child urination logs" on public.urination_records
  for update to authenticated using (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid() and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
    and (visibility<>'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
  ) with check (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid() and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
    and (visibility<>'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
  );
create policy "authors can delete own unverified child urination logs" on public.urination_records
  for delete to authenticated using (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid() and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
    and (visibility<>'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
  );

drop policy if exists "linked writers can update child sleep logs" on public.sleep_records;
drop policy if exists "linked writers can delete child sleep logs" on public.sleep_records;
create policy "authors can update own unverified child sleep logs" on public.sleep_records
  for update to authenticated using (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid() and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
    and (visibility<>'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
  ) with check (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid() and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
    and (visibility<>'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
  );
create policy "authors can delete own unverified child sleep logs" on public.sleep_records
  for delete to authenticated using (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid() and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
    and (visibility<>'sensitive_adolescent' or medvita_private.has_sensitive_access(patient_id))
  );

drop policy if exists "linked writers can update age-appropriate vitals" on public.vitals;
drop policy if exists "linked writers can delete age-appropriate vitals" on public.vitals;
create policy "authors can update own unverified age-appropriate vitals" on public.vitals
  for update to authenticated using (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid() and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and (p.life_stage in ('adult','senior') or (p.life_stage in ('infant','child') and vital_type='temperature')))
  ) with check (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid() and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and (p.life_stage in ('adult','senior') or (p.life_stage in ('infant','child') and vital_type='temperature')))
  );
create policy "authors can delete own unverified age-appropriate vitals" on public.vitals
  for delete to authenticated using (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid() and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and (p.life_stage in ('adult','senior') or (p.life_stage in ('infant','child') and vital_type='temperature')))
  );

drop policy if exists "linked writers can update child vaccination records" on public.vaccination_records;
drop policy if exists "linked writers can delete child vaccination records" on public.vaccination_records;
create policy "authors can update own unverified child vaccination records" on public.vaccination_records
  for update to authenticated using (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid() and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
  ) with check (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid() and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
  );
create policy "authors can delete own unverified child vaccination records" on public.vaccination_records
  for delete to authenticated using (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid() and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
  );

drop policy if exists "linked writers can update child milestones" on public.developmental_milestones;
drop policy if exists "linked writers can delete child milestones" on public.developmental_milestones;
create policy "authors can update own unverified child milestones" on public.developmental_milestones
  for update to authenticated using (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid() and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
  ) with check (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid() and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
  );
create policy "authors can delete own unverified child milestones" on public.developmental_milestones
  for delete to authenticated using (
    medvita_private.has_patient_access(patient_id,'write') and created_by=auth.uid() and verification_status='unverified'
    and exists(select 1 from public.patient_profiles p where p.id=patient_id and p.life_stage in ('infant','child'))
  );
