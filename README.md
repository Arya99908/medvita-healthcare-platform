# MEDVITA

**Your Health. Your Life. One Connected Ecosystem.**

MEDVITA is a life-stage-aware healthcare platform prototype. It combines a public, interactive presentation demo with a separate Supabase-backed account workspace. The demo is designed to showcase the product journey from a family overview through life-stage care, records, coordination, and reporting. It uses fictional data and is not a clinical service.

**Live prototype:** [medvita-healthcare-platform.vercel.app](https://medvita-healthcare-platform.vercel.app)

## Contents

- [Quick start](#quick-start)
- [The demo, from first screen to last](#the-demo-from-first-screen-to-last)
- [Profiles and life-stage features](#profiles-and-life-stage-features)
- [All 22 destinations](#all-22-destinations)
- [Guided presentation journeys](#guided-presentation-journeys)
- [Accessibility and supported languages](#accessibility-and-supported-languages)
- [Data, privacy, and simulation boundaries](#data-privacy-and-simulation-boundaries)
- [Authenticated account workspace](#authenticated-account-workspace)
- [Environment configuration](#environment-configuration)
- [Database and migrations](#database-and-migrations)
- [Deploying to Vercel](#deploying-to-vercel)
- [Checks](#checks)
- [Project map](#project-map)
- [Prototype limits](#prototype-limits)

## Quick start

Requirements: Node.js 22 or newer and npm.

```bash
git clone https://github.com/Arya99908/medvita-healthcare-platform.git
cd medvita-healthcare-platform
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root page opens the synthetic demo. No Supabase account, AI key, or database setup is needed to explore it.

For a production-mode local run:

```bash
npm run build
npm run start
```

## The demo, from first screen to last

1. **Start at Overview.** Review the selected profile, latest fictional measurements, trend chart, medicine schedule, recent events, appointments, care circle, tasks, and wellness entry point.
2. **Choose a person.** Use the profile selector to switch among six life stages. The overview, chart, records, and tools update for the selected profile.
3. **Open a care area.** Visit a life-stage screen or another destination from the sidebar. On small screens, open the navigation drawer. Hash navigation lets you link directly to a screen, for example `/#Medical%20History`.
4. **Record or coordinate care.** Add or edit a fictional observation, medicine, appointment, document, task, or wellness activity. Changes persist in this browser and can be reviewed in history, calendar, analytics, and reports.
5. **Explore connections.** Review a medical timeline, prepare a deterministic demo summary, set a personal wellness goal, create a caregiver handover, or open the doctor demonstration view.
6. **Present the story.** Select **Explore the guided demo** for a prepared journey, or turn on **Presentation mode** to reduce interface distractions. Use Settings to restore the original sample data between demonstrations.

The demo clock is fixed at **20 November 2026**. Calendar and record times use **Asia/Kolkata (IST, UTC+05:30)**.

## Profiles and life-stage features

All six profiles are fictional and can be switched without leaving the demo:

| Profile | Demo focus |
| --- | --- |
| Aarav Sharma · 9 months | Infant feeding, sleep, growth observations, vaccinations, and caregiver notes |
| Vihaan Mehta · 8 years | School-age growth, sleep, activity, vaccination, and school/play observations |
| Ananya Sharma · 16 years | Adolescent girl wellbeing, menstrual history, privacy-aware notes, and healthy routines |
| Kabir Nair · 16 years | Adolescent boy wellbeing, puberty education, activity, sleep, and private questions |
| Priya Sharma · 42 years | Adult health, reported hypertension and diabetes context, medicines, and preventive records |
| Rajesh Sharma · 72 years | Senior care, chronic-condition context, mobility, medicines, family coordination, and hospital history |

Profile details, allergies, conditions, measurements, prescriptions, appointments, and care events are sample values for the presentation. They are not verified patient information.

## All 22 destinations

| Destination | What the prototype demonstrates |
| --- | --- |
| **Overview** | Profile-specific summary, recent measurements and charts, scheduled medicines, upcoming visits, care team, tasks, and shortcuts. |
| **My Health Profile** | Demographic and care-context details, including reported allergies, conditions, history, clinician, hospital, contact, and lifestyle information. |
| **Child Health** | Infant and school-age observation forms for feeding, bowel movements, vomiting, diapers, temperature, sleep, growth, vaccination, and milestones. |
| **Adolescent Health** | Female and male educational views, wellbeing records, and sensitive personal entries excluded from shared demo views. Menstrual details appear only in the girl profile. |
| **Adult Health** | Vitals, activity, symptoms, prevention, laboratory and consultation records. |
| **Elderly Care** | Symptoms, mobility and hydration observations, medicines, caregiver tasks, clinician instructions, handovers, and emergency access. |
| **Medical History** | Filterable chronological record timeline with date/category filters, source and demo-verification labels, linked document previews, and add/edit/delete actions. |
| **Medical Documents** | Local PDF, image, or text uploads; metadata, search, preview, download, removal, and correction of clearly mock extraction fields. |
| **Medications** | Fictional prescription schedules, four daily time groups, date ranges, refill details, taken/missed dose records, and prescription history. |
| **AI Health Intelligence** | Deterministic summaries based on the selected fictional records, suggested or custom questions, historical comparisons, missing-information prompts, saved reports, and downloads. |
| **Remedies & Wellness** | Educational wellness centre with profile-specific recommendations and precautions. |
| **Exercise** | Movement recommendations, saved plans, personal weekly goals, dated completions, progress, and undo. |
| **Food & Nutrition** | Meal and hydration education, recorded preference, allergy context, and activity tracking. |
| **Habits & Lifestyle** | Sleep, hygiene, routines, personal goals, and dated activity tracking. |
| **Medical Calendar** | Month, week, day, and agenda views; event categories; create/edit/delete, status, recurrence, reminders, and ICS export. Duplicate event entries are checked. |
| **Caregiver Management** | Fictional care contacts, role/permission demonstrations, care tasks, medication administration, activity history, and handover summaries. |
| **Doctor Dashboard** | Profile switching, shared records, prescriptions, trends, follow-up scheduling, and separately labelled clinician-note demonstrations. |
| **Hospital Records** | Filtered visits, admissions, discharge, and clinical history with linked document references. |
| **Emergency Assistance** | Emergency information, confirmation flow, local location request, and device dialler links for configured numbers. |
| **Analytics & Reports** | Measurement trends, symptom and adherence summaries, wellness progress, date ranges, report previews, downloads, and browser print. |
| **Notifications** | Simulated in-app notices with read/unread and category filters, badge counts, and preferences. |
| **Settings** | Profile, navigation language, theme, high contrast, larger text, confidentiality reminders, emergency number, export, and confirmed demo reset. |

## Guided presentation journeys

Choose **Explore the guided demo** in the sidebar to start a prepared sequence. **Next stop** advances the story; **Finish journey** returns to the chooser.

1. **A growing start** — child health → profile → analytics → demo summary.
2. **Space to grow** — adolescent health → wellness → calendar.
3. **Everyday prevention** — adult health → medications → analytics.
4. **Care that stays connected** — senior care → history → medication → hospital records → caregiver handover → demo summary → doctor view.
5. **One health ecosystem** — wellness → exercise → nutrition → habits → calendar → hospital history → emergency → caregiver management → notifications.

For a clean pitch, reset the demo in **Settings**, enable **Presentation mode**, then start a journey. Reset removes this browser's demo edits and local uploads.

## Accessibility and supported languages

- Responsive desktop, tablet, and mobile layout with a mobile navigation drawer.
- Keyboard focus styles, dialog controls, search, larger text and controls, high contrast, and light/dark themes.
- English interface content with Hindi and Kannada translations for the main navigation labels. Health content itself remains in English.
- Optional browser speech output and search dictation. These controls are user initiated and depend on browser support and permissions.
- Error recovery controls keep the navigation available if a demo screen fails.

## Data, privacy, and simulation boundaries

- Demo records and preferences are stored in this browser's `localStorage`; they are not sent to Supabase or an AI provider. Each browser and domain has its own demo data.
- The demo profiles and health values are fictional. Do not enter real patient information.
- AI Health Intelligence in the demo is deterministic sample logic. It is not a clinical AI system and does not diagnose, prescribe, or recommend medication changes.
- Document extraction, in-app notifications, reminder delivery, caregiver permissions, and handovers are demonstrations. Uploaded files remain local; the demo's mock extraction does not interpret file contents.
- Emergency actions may open the device dialler after a user action. The prototype does not place a confirmed call, contact caregivers, or dispatch emergency services.
- Wellness content is general education. It is not a personalised treatment, diet, or exercise plan.
- Sensitive adolescent entries are filtered from shared demo views, but browser-local filtering is not account security or a production privacy boundary.

## Authenticated account workspace

The root demo is separate from the existing account-backed application. Account pages use Supabase Auth and row-level security (RLS); they require the project's Supabase environment variables and a signed-in user.

| Route | Purpose |
| --- | --- |
| `/login` | Account sign-in and registration |
| `/reset-password` and `/update-password` | Password recovery flow |
| `/account` | Signed-in profile and linked patient records |
| `/account/doctor` | Professional registration and consented doctor workspace |
| `/account/admin` | Restricted administrator review tools |
| `/account/care` | Care task list |
| `/account/calendar` | Account calendar and ICS export |
| `/account/notifications` | Account notification center and preferences |
| `/account/security` | Account security and multi-factor settings |

The account workspace has patient-owned profiles, consent-scoped caregiver/doctor access, record timelines, medication schedules and status events, document library, optional local OCR, wellness center, care tasks, appointments, emergency history, reports, and account export. Doctors cannot alter general patient records through the demo doctor dashboard; account clinical notes and AI-summary reviews follow separate consent rules. See [administrator setup](docs/admin-setup.md), [frontend architecture](docs/FRONTEND_ARCHITECTURE.md), and [delivery notes](docs/FINAL_FRONTEND_INTEGRATION.md) for more detail.

## Environment configuration

The presentation demo works without environment variables. To use account sign-in and Supabase-backed routes:

```bash
cp .env.example .env.local
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. Never put a Supabase service-role key in browser code or commit `.env.local`.

Optional live account summaries require server-side `AI_GATEWAY_API_KEY` and `MEDVITA_AI_MODEL`. Account summaries are subject to patient consent and server-side RLS filtering; without these values, live summaries are unavailable. The root presentation demo continues to use synthetic data.

## Database and migrations

The Supabase schema, RLS policies, storage configuration, and account features are part of this repository under [`supabase/`](supabase/). Use a dedicated MedVita Supabase project and review the migration files before applying them to any environment. The final frontend prototype archive did not require schema changes: its new presentation screens use the existing local demo data model and browser storage.

The project’s Supabase Auth Site URL and callback allow-list include the canonical production URL. Do not run migrations against another product's database.

## Deploying to Vercel

The GitHub `main` branch is connected to the Vercel project. A push to `main` triggers a production deployment. The public production URL is [medvita-healthcare-platform.vercel.app](https://medvita-healthcare-platform.vercel.app); the root presentation demo is accessible without Vercel team login. Account routes still require Supabase authentication.

To deploy manually from an authenticated Vercel CLI session:

```bash
vercel deploy --prod
```

Configure Supabase values in the Vercel project's environment settings before expecting account routes to work. Add AI Gateway variables only when enabling the optional account-summary integration.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The current merged repository's latest recorded validation is **221 passing tests**, clean lint and typecheck, and a successful Next.js production build. See [final frontend integration](docs/FINAL_FRONTEND_INTEGRATION.md) for validation scope and limits.

## Project map

```text
src/app/                  Next.js pages, account routes, and API routes
src/components/demo/      Presentation demo screens and shared UI
src/lib/demo/             Fictional profile data and demo selectors
src/app/medvita-demo.css  Demo-specific responsive and accessibility styles
supabase/migrations/      Database schema and policy migrations
supabase/tests/           Database policy and access tests
tests/                    Frontend and application unit tests
docs/                     Architecture, deployment, setup, and delivery notes
```

## Prototype limits

MEDVITA is a demonstration, not a clinical product. Health values are user-entered or synthetic and remain unverified. The fixed demo date does not advance with the clock. Calendar recurrence supports daily, weekly, and monthly series, without per-occurrence exceptions or timezone selection. Charts show recorded values; they do not calculate clinical interpretations or growth percentiles. Browser storage has finite capacity (demo uploads are limited to 1.5 MB per file) and is not secure medical-record storage. No regulatory, clinical-validation, or production-readiness claim is made.
