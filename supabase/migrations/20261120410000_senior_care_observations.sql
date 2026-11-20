create table public.senior_care_observations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  observation_type text not null check (observation_type in ('mobility','fall','activity','appetite','hydration')),
  details text not null check (char_length(btrim(details)) between 3 and 1000),
  observed_at timestamptz not null default now(),
  source text not null check (source in ('patient','caregiver')),
  verification_status text not null default 'unverified' check (verification_status = 'unverified'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

comment on table public.senior_care_observations is
  'Patient or caregiver entered senior daily observations. Entries are unverified and are not assessed for risk or clinical meaning.';
comment on column public.senior_care_observations.details is
  'Free-text observation, not a diagnosis, clinical score, or care recommendation.';

create index senior_care_observations_patient_observed_idx
  on public.senior_care_observations(patient_id, observed_at desc);

alter table public.senior_care_observations enable row level security;
revoke all on public.senior_care_observations from anon, authenticated;
grant select, insert on public.senior_care_observations to authenticated;

create policy "linked users can read senior observations"
  on public.senior_care_observations for select to authenticated
  using (medvita_private.has_patient_access(patient_id, 'read'));

create policy "senior patients and care partners can add observations"
  on public.senior_care_observations for insert to authenticated
  with check (
    created_by = auth.uid()
    and medvita_private.has_patient_access(patient_id, 'write')
    and exists (
      select 1
      from public.patient_profiles p
      join public.patient_relationships r on r.patient_id = p.id
      where p.id = senior_care_observations.patient_id
        and p.life_stage = 'senior'
        and r.user_id = auth.uid()
        and r.status = 'active'
        and r.can_read and r.can_write
        and r.relationship_role in ('patient','guardian','caregiver','family_member','nurse')
        and ((source = 'patient') = (r.relationship_role = 'patient'))
    )
  );

create trigger record_senior_observation_activity
  after insert on public.senior_care_observations
  for each row execute function medvita_private.record_patient_activity();
