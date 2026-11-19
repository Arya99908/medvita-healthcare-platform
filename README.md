# MedVita

**Your Health. Your Life. One Connected Ecosystem.**

MedVita is an early life-stage-aware healthcare prototype. It has a responsive fictional presentation demo, Supabase authentication, and a hosted Postgres/RLS schema with limited authenticated profile, timeline-note, appointment, self-reported medicine-note, and private-document flows. It is not a clinical system or production medical record service.

## Run locally

Requirements: Node.js 22 or newer.

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. The presentation switcher includes infant, child, adolescent girl, adolescent boy, adult, and senior sample profiles. It supports manual switching and an automatic walkthrough, larger text, high contrast, a health timeline, age-aware sample care logs, demo medication and wellness interactions, local notes, appointment samples, a device-dialer emergency screen, and a fictional JSON report export.

The demo is intentionally synthetic. Notes and care logs use this browser's local storage; selected document names are held in page memory. No file contents are uploaded, and the demo does not send health data to Supabase or an AI provider. The emergency page opens `tel:` links after a user action; it cannot share location, notify contacts, or confirm that help is coming.

## Supabase setup

Use a dedicated MedVita Supabase project. Never point this prototype at another product's database.

1. Copy `.env.example` to `.env.local` and set the project URL and publishable key. Do not expose a service-role key to browser code.
2. The connected dedicated project is `Med-Vita` (`udjcnvwvlxnmsiacbqpl`, `ap-south-1`). The five migrations in `supabase/migrations/` have been applied. `src/lib/database.types.ts` is generated from this project.
3. Generate client types with `supabase gen types typescript --project-id udjcnvwvlxnmsiacbqpl > src/lib/database.types.ts`.
4. Local, MedVita preview, and production alias auth callback redirects are allow-listed. The production site URL is `https://medvita-healthcare-platform-the-vipers.vercel.app`.
5. Run the fictional transaction-based access checks in `supabase/tests/rls_access.test.sql` against the linked dedicated project. The SQL test rolls back its fixtures and uses `finish(true)` to return a failure if an assertion fails.

The database contains 40 public tables, all with RLS enabled, and a private `medical-documents` bucket. The account export uses an invoker-privilege RPC so RLS applies, excludes sharing token hashes, and does not include uploaded file contents or browser-only demo data. The security advisor reported no findings after moving `SECURITY DEFINER` helpers out of the exposed `public` schema. `supabase db lint --linked` passes. Synthetic presentation profiles remain in the frontend and are not inserted into patient tables.

## Delivery status

- **Working locally:** responsive dashboard; six fictional profiles and timed presentation walkthrough; text-size and contrast controls; overview, timeline, medicines, appointments, wellness, documents, and emergency demo sections; stage-specific synthetic care logs; local sample notes; demo medication toggles; wellness checklist; filename-only document selection; JSON report export; structured synthetic AI summary with a clearly labeled static fallback.
- **Connected:** Supabase browser/server clients, session-refresh proxy, PKCE confirmation and password-recovery callbacks; email/password sign-in, sign-up, and password recovery UI; authenticated `/account` route for listing accessible profiles, creating a self profile or pending guardian request, downloading an RLS-filtered JSON data export, and opening a read/write RLS-checked timeline, symptom observations, infant/child feeding, bowel-movement, vomiting, and growth-measurement logs, appointment list, medicine-note list, and private document library. Users with active write access can save unverified personal notes, symptom observations, infant/child care logs, appointment plans, and self-reported medicine notes; update appointment-plan and medicine-note status; and upload supported documents up to 4 MB. Child care logs and growth measurements are limited to infant and child profiles and remain unverified reports; no clinical growth percentile is calculated. Document downloads use short-lived private links. No OCR or AI analysis runs on uploaded files. Symptom severity is self-reported, not clinically assessed. Appointment entry and status changes do not contact a clinic, calendar, or reminder service; medicine notes do not prescribe or check doses. `.env.example`, applied database schema, RLS policies, and private storage bucket. Vercel has the public project URL and publishable key in all environments; the local `.env.local` is ignored by Git.
- **GitHub:** private repository at [Arya99908/medvita-healthcare-platform](https://github.com/Arya99908/medvita-healthcare-platform). No secrets or real patient records are committed.
- **Vercel:** the production alias is [medvita-healthcare-platform-the-vipers.vercel.app](https://medvita-healthcare-platform-the-vipers.vercel.app); the current protected preview is [medvita-healthcare-platform-hr2lovzs2-the-vipers.vercel.app](https://medvita-healthcare-platform-hr2lovzs2-the-vipers.vercel.app). Both require Vercel team authentication. The earlier workspace-name deployment remains in Vercel history.
- **Not yet implemented or verified:** account deletion, timeline edit/delete, medication note detail edits and deletion, schedules and administration logs, growth percentiles and clinical trend validation, clinic booking or external cancellation, role-specific dashboards, invitations and permission management, production adolescent-consent workflows, validated vitals, OCR and verified extraction, AI summaries from real patient records, configured AI provider credentials and live-provider verification, real notifications, calendar sync, emergency contact escalation and location sharing, administrator workflows, complete end-to-end flows, and legal/privacy/clinical review. Appointment status and medicine status only update the profile’s own list; all entries remain unverified. The account workflow remains an initial prototype; pending guardian requests do not grant record access.

The Supabase default email sender is rate-limited; configure a trusted SMTP provider before relying on account confirmation and recovery emails. The emergency screen's India 112 and Karnataka 108 examples reference the [Ministry of Home Affairs ERSS page](https://www.mha.gov.in/emergency-response-support-system-erss) and a [Karnataka Health and Family Welfare Department report](https://hfwcom.karnataka.gov.in/storage/pdf-files/AnnualreportJanuaryendEng2024-25.pdf). Configure and verify regional emergency options before any real-world use.

Use fictional data only. Do not rely on this prototype for diagnosis, treatment, medication decisions, emergency dispatch, or clinical record keeping. No regulatory compliance is claimed.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```
