# Deploy the MEDVITA frontend prototype

This is a guide for the existing MedVita repository, which includes the integrated final frontend prototype and authenticated account routes. Keep `package-lock.json` so the tested dependency versions are used.

## Requirements

- Node.js 20.9 or newer (the installed Next.js package's minimum).
- npm and internet access to install dependencies.
- A hosting environment that supports Next.js applications or a persistent Node.js server. This archive is source code, not a static HTML export.

## Install and verify

Run these commands in the extracted project folder:

```sh
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

## Run the production application

```sh
npm run start -- --hostname 0.0.0.0 --port 3000
```

Open `http://localhost:3000` on your computer. On a server, use your normal process manager and HTTPS reverse proxy. If the host supplies a port, pass that port to `npm run start -- --port PORT_NUMBER`.

For development only:

```sh
npm run dev -- --port 3100
```

## Deploy with a Next.js-compatible host

1. Upload this extracted source to your own repository or the host's source-upload mechanism.
2. Select the extracted project folder as the root directory and Next.js as the framework.
3. Use `npm ci` as the install command and `npm run build` as the build command.
4. Use the host's standard Next.js runtime/output settings. Do not upload only `src` or configure this as a plain static site.
5. For hosts requiring a start command, use `npm run start` with the port configuration required by that host.
6. Open the deployed URL and check patient switching, a saved health record after refresh, and the guided demo.

No environment variables, Supabase setup, database migrations, AI keys, OCR keys or notification services are required for this frontend demo. The `.env.example` file contains empty placeholders from the existing project; do not configure those integrations for this handoff. Pre-existing backend files are included unchanged for project completeness and are not used by the prototype interface.

## Start a clean presentation

1. Open Settings and reset demo data if necessary.
2. Enable Presentation mode.
3. Open “Explore the guided demo” in the sidebar.
4. Select one of the five journeys or switch among the six fictional patient profiles.

The demo date is fixed to 20 November 2026. AI/OCR, alerts and caregiver services are clearly labeled simulations. Ambulance actions open a dialler; they do not dispatch an ambulance.

Data is stored in the browser's localStorage, separately for each domain/port. Your friend's deployment starts with seeded fictional data; edits made in another browser or localhost are not included in this archive. Uploads have a 1.5 MB per-file limit and are subject to browser storage capacity. Use HTTPS for browser geolocation where supported.

## Included and excluded

Included: application source, configuration, exact dependency lockfile, unit tests, README, deployment instructions and the frontend audit/completion documents.

Excluded: `node_modules`, `.next`, local environment files/secrets, editor/browser state, generated screenshots and test artifacts. Run `npm ci` and `npm run build` after extraction to recreate dependencies and production output. Some historical audit links point to local evidence artifacts that are intentionally not shipped.

See `docs/FRONTEND_PRESENTATION_AUDIT.md` for the feature checklist and prototype limits. This handoff packages the tested frontend demonstration; it does not make the application a production clinical service.
