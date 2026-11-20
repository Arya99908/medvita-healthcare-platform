-- Preserve facility and clinician names as entered at the time of care.
alter table public.hospital_visits
  add column facility_name text check (facility_name is null or char_length(btrim(facility_name)) between 2 and 160),
  add column provider_name text check (provider_name is null or char_length(btrim(provider_name)) between 2 and 120);

alter table public.hospital_admissions
  add column facility_name text check (facility_name is null or char_length(btrim(facility_name)) between 2 and 160);

comment on column public.hospital_visits.facility_name is
  'Facility name captured as entered by the patient or caregiver; not a verified hospital directory entry.';
comment on column public.hospital_visits.provider_name is
  'Clinician name captured as entered by the patient or caregiver; not a verified provider identity.';
comment on column public.hospital_admissions.facility_name is
  'Facility name captured as entered by the patient or caregiver; not a verified hospital directory entry.';
