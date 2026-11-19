# MedVita architecture and delivery status

## Current application shape

```mermaid
flowchart LR
  Browser[Responsive Next.js App Router] --> Demo[Six fictional local profiles]
  Browser --> Auth[Supabase Auth]
  Auth --> Account[Authenticated profile route]
  Account --> RLS[Postgres row-level security]
  RLS --> Records[Profile and patient records]
  RLS --> Storage[Private medical document bucket]
  Server[Next.js server routes] -. not implemented .-> AI[Configured AI provider]
```

The app is a presentation demo that runs without credentials. Stage switching moves among an infant, child, adolescent girl, adolescent boy, adult, and senior. The timed walkthrough is intended for presentations. Demo profiles are bundled in the client; local notes use browser storage, while uploaded filename samples stay in page memory. No real health data is sent to a provider.

The app uses Next.js App Router, strict TypeScript, Tailwind CSS, and Lucide icons. Supabase browser/server clients, a Next.js 16 `proxy.ts` session-refresh hook, and a PKCE callback route are configured for the dedicated `Med-Vita` Supabase project.

## Intended data and access boundaries

- `profiles` and `user_roles` are tied to authenticated Supabase users.
- A `patient_profile` is separate from an account. Access is through active `patient_relationships` with explicit read/write flags.
- Clinician access also requires an `access_permissions` row.
- Sensitive adolescent rows use `visibility = 'sensitive_adolescent'`; the draft RLS helper requires patient access or a matching active consent record. Guardian status alone is not intended to grant this scope.
- Medical documents use a private `medical-documents` bucket with patient-folder policies.
- OCR output is not a verified medical fact until a person reviews it.
- Synthetic presentation profiles are not inserted into patient tables.

The three migrations are applied to the dedicated `Med-Vita` project (`udjcnvwvlxnmsiacbqpl`, `ap-south-1`). All 40 public tables have RLS enabled; the medical-document bucket is private. After the security helper migration, the Supabase security advisor reported no findings. A transaction-based SQL suite checks patient, guardian, clinician, sensitive-consent, profile-creation, and pending-guardian boundaries with fictional fixture identities and rolls them back. `supabase db lint --linked` reports no schema errors.

## Delivery checklist

| Area | State | Notes |
|---|---|---|
| Accessible life-stage presentation demo | Implemented | Six profiles, keyboard tabs, timed walkthrough, larger text, contrast control |
| Demo interactions | Implemented | Local notes and age-aware care logs, medicine toggles, wellness checklist, appointment samples, fictional JSON export |
| Account and profile entry | Implemented (limited) | Email/password sign-in, sign-up, and reset; list RLS-visible profiles; create adult self-profile or submit a pending minor guardian request |
| Supabase SSR client setup | Configured | Cookie-based clients, `proxy.ts`, and PKCE callback |
| Core database schema | Applied | Three migrations; patient, relationships, consent, clinical, medication, documents, calendar, wellness, AI, alerts, notifications |
| Hosted database and RLS configuration | Applied | 40 public tables have RLS; private document bucket; security advisor clear |
| RLS access-isolation verification | SQL checks added | Fictional role/consent cases run transactionally; standard `supabase test db --linked` still requires local Docker/Podman |
| Patient CRUD and sharing | Not implemented | Needs server-side authorization and isolation tests |
| Role-specific care workflows | Not implemented | Doctor, caregiver, clinic, and platform admin screens remain |
| AI/OCR/notifications/calendar integrations | Not implemented | Requires provider setup, backend paths, and reviewable error states |
| Emergency demo | Implemented locally | User-initiated `tel:` links and fictional quick-reference card; no contact alert, location sharing, dispatch, or call confirmation |
| Local checks | Passing | TypeScript, lint, six demo tests, four account action tests, four password-recovery tests, production build |
| GitHub | Complete | Private `Arya99908/medvita-healthcare-platform`; credentials and patient records excluded |
| Vercel | Deployed | Protected production alias and preview; deployment protection requires Vercel team authentication |

## Required next work

1. Add authenticated health-event and medication CRUD with access checks and audit trails.
2. Implement reviewed role-specific workflows and permission management; keep sensitive adolescent access consent-based.
3. Add private file uploads, calendar and notification services, AI summaries, and emergency handoff as independently configurable integrations.
4. Complete security, privacy, legal, and clinical review before any real-world use.
