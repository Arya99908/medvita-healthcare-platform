# MedVita

**Your Health. Your Life. One Connected Ecosystem.**

MedVita is a life-stage-aware healthcare platform prototype. This repository currently provides a presentation-ready, fictional demo experience and the first Supabase schema migration. It is not a production medical record system.

## Run the local demo

Requirements: Node.js 20.9 or newer.

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. The demo works without external credentials. It includes sample views for an infant, child, adolescent girl, adolescent boy, adult, and senior; a profile walkthrough; accessible text-size and contrast controls; a health timeline; medicine and wellness demo interactions; locally saved sample notes; and a fictional report export.

Demo notes are stored in this browser's local storage. Selected document names are held in page memory only; files are not uploaded. The demo does not contact an AI provider or send real health data to Supabase.

## Configure Supabase

1. Create or select a dedicated MedVita project. Do not point this prototype at another product's database.
2. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key from the Supabase dashboard. Never put a service-role key in a `NEXT_PUBLIC_` variable.
3. Link the local CLI to the dedicated project with `supabase link --project-ref <project-ref>`.
4. Review `supabase/migrations/202611190001_medvita_core.sql`, then apply it with `supabase db push`.
5. Generate client types with `supabase gen types typescript --linked > src/lib/database.types.ts`.

The migration enables RLS on patient-scoped records, uses patient relationships for access, requires a separate consent grant for sensitive adolescent records, and creates a private medical-document bucket. It intentionally does not seed synthetic patient rows into the hosted database.

## Current implementation status

- **Working locally:** responsive presentation dashboard; six synthetic profiles; profile switching and timed walkthrough; accessible text-size and contrast controls; sections for overview, timeline, medication, appointments, wellness, and documents; local demo note creation; demo medication toggles; wellness checklists; local file-name selection; JSON report download; Supabase email/password sign-in and account creation when configured.
- **Prepared but not connected:** Supabase SSR clients and session refresh proxy; `.env.example`; database migration and private storage policies.
- **Not implemented or verified:** live patient CRUD through Supabase; invitation and role administration; production adolescent-consent workflows; clinical rules or reviewed content; AI summaries; OCR; external notifications; calendar sync; operational emergency escalation; physician/admin dashboards; backend and end-to-end tests; execution of the database migration; GitHub publication; Vercel deployment; legal, privacy, and clinical review.

No production deployment or regulatory compliance is claimed. Use fictional data only until the relevant services, access rules, security controls, and clinical content have been reviewed.

## Commands

```sh
npm run typecheck
npm run lint
npm test
npm run build
```
