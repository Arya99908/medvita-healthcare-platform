-- Pediatric profiles may store thermometer readings, while other vital types remain adult/senior-only.
drop policy "linked readers can read" on public.vitals;
drop policy "linked writers can insert" on public.vitals;
drop policy "linked writers can update" on public.vitals;
drop policy "linked writers can delete" on public.vitals;

create policy "linked readers can read age-appropriate vitals" on public.vitals
  for select to authenticated using (
    medvita_private.has_patient_access(patient_id,'read')
    and exists (
      select 1 from public.patient_profiles p
      where p.id=patient_id
        and (p.life_stage in ('adult','senior') or (p.life_stage in ('infant','child') and vital_type='temperature'))
    )
  );
create policy "linked writers can insert age-appropriate vitals" on public.vitals
  for insert to authenticated with check (
    medvita_private.has_patient_access(patient_id,'write')
    and exists (
      select 1 from public.patient_profiles p
      where p.id=patient_id
        and (p.life_stage in ('adult','senior') or (p.life_stage in ('infant','child') and vital_type='temperature'))
    )
    and (created_by is null or created_by=auth.uid())
  );
create policy "linked writers can update age-appropriate vitals" on public.vitals
  for update to authenticated using (
    medvita_private.has_patient_access(patient_id,'write')
    and exists (
      select 1 from public.patient_profiles p
      where p.id=patient_id
        and (p.life_stage in ('adult','senior') or (p.life_stage in ('infant','child') and vital_type='temperature'))
    )
  ) with check (
    medvita_private.has_patient_access(patient_id,'write')
    and exists (
      select 1 from public.patient_profiles p
      where p.id=patient_id
        and (p.life_stage in ('adult','senior') or (p.life_stage in ('infant','child') and vital_type='temperature'))
    )
  );
create policy "linked writers can delete age-appropriate vitals" on public.vitals
  for delete to authenticated using (
    medvita_private.has_patient_access(patient_id,'write')
    and exists (
      select 1 from public.patient_profiles p
      where p.id=patient_id
        and (p.life_stage in ('adult','senior') or (p.life_stage in ('infant','child') and vital_type='temperature'))
    )
  );
