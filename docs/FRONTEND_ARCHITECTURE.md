# MEDVITA architecture

Next.js App Router serves a responsive React application and validated server API routes. Supabase Auth owns identity; PostgreSQL owns patient relationships and granular consent; private Storage owns documents. Server-side AI retrieves only records visible to the caller and validates structured output. Clinical content must be reviewed before activation.

## Data boundary
Authenticated requests use the caller's JWT and RLS. No service-role credential is used by interactive patient APIs. Demo mode uses fictional records persisted only on this device; it is explicitly labeled and must never accept real patient information. Demo is not an authentication bypass into production tables.

Patient access is separately granted for read, record, clinical-write, sensitive-read, and management. Doctor status is verified independently. Sensitive entries require explicit patient-level consent and access; guardianship alone does not grant access. Administrative roles confer no patient-data access.

## Modules
The synthetic demo exposes 22 destinations: overview, health profile, infant/child/adolescent/adult/senior views, medical history, documents, medication schedules, deterministic AI summaries, wellness, exercise, nutrition, habits, calendar, caregiver management, doctor dashboard, hospital history, emergency assistance, analytics, notifications, and settings. Presentation demo data remains isolated in browser storage; account pages continue to use the existing authenticated backend.

## Design
Ink #142E38, teal #087F78, mint #E4F3EE, canvas #F4F7F8, white #FFFFFF, emergency #B84242. System humanist sans for readable operational text; large headings and tabular measurements. Left-aligned content with a fixed narrow navigation, family strip, wide care overview and narrow daily schedule.

```
nav | profile switcher / search / emergency
    | greeting                     add record
    | family profiles
    | health measurements
    | longitudinal chart          today's care
    | recent records              upcoming visits
```
Review: replaced an undifferentiated grid of cards with a care-day rail and family context. Health status reflects recorded information, never a computed claim that a patient is safe.

## Deployment and external boundaries
Private GitHub repository, separate Supabase project, Vercel production and previews. All integration credentials are server-only, except Supabase publishable key. Unconfigured providers return unavailable states; no delivery, dispatch, OCR, or AI success is fabricated.

## Release gates
Typecheck, lint, unit/API tests, browser tests, production build, real RLS isolation tests, storage checks and deployed smoke tests. Legal/clinical review is a separate prerequisite for use with actual patients, not a claim supplied by passing tests.
