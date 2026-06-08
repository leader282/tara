# Tara

Tara is a private mobile app for long-distance couples. It gives exactly two partners a calm shared space for presence pulses, rituals, memory capsules, a private timeline, reunion countdowns, quiet-hours-aware notifications, and account safety controls.

The product is intentionally not a dating app, social network, chat replacement, location tracker, or monetization surface. Privacy, emotional safety, and two-person data isolation are release gates, not optional polish.

## What This Repo Contains

- Expo + React Native app using Expo Router, TypeScript, TanStack Query, React Hook Form, Zod, and a token-based theme system.
- Supabase backend schema, RLS policies, storage policies, seed data, generated database types, and pgTAP privacy tests.
- Supabase Edge Functions for notification processing, push receipt checks, and account deletion processing.
- Sentry React Native integration with privacy-focused event and breadcrumb sanitization.
- Internal QA, release, privacy, RLS, and distribution documentation under `docs/`.

## Product Principles

- One couple space contains exactly two partners.
- Every shared domain row is tenant-scoped by `couple_id`.
- RLS and RPC workflows enforce privacy-sensitive rules; the UI never acts as the only privacy boundary.
- Locked capsule content and unrevealed ritual responses must not leak through queries, realtime payloads, logs, monitoring, notifications, or timeline summaries.
- Notifications must be gentle, privacy-safe, and recipient quiet-hours aware.
- No exact GPS, public profiles, followers, read receipts, last-seen tracking, guilt streaks, subscriptions, or AI analysis of private memories in the MVP.

## Tech Stack

- **App:** Expo SDK 56, React Native 0.85, React 19, Expo Router
- **Language:** TypeScript with strict mode
- **Data:** Supabase Auth, Postgres, RLS, Realtime, Storage, Edge Functions
- **State:** TanStack Query for server state; local state kept feature-scoped
- **Validation:** Zod
- **Forms:** React Hook Form
- **Testing:** Jest, React Native Testing Library, Supabase pgTAP tests
- **Monitoring:** Sentry React Native
- **Distribution:** EAS build profiles for development, preview, and production

## Repository Layout

```text
app/                     Expo Router routes and route groups
src/components/          Shared UI primitives and reusable components
src/features/            Feature-owned APIs, hooks, screens, schemas, and components
src/lib/                 Infrastructure: Supabase, query client, env, errors, logging, monitoring
src/theme/               Design tokens and theme exports
supabase/migrations/     Database schema, RLS, RPC, storage, and workflow migrations
supabase/functions/      Edge Functions and shared server utilities
supabase/tests/          Local pgTAP/RLS privacy tests
docs/                    Architecture, QA, release, privacy, and roadmap documentation
__tests__/               Jest unit and component tests
assets/                  App icon and splash assets
```

Canonical data flow:

```text
screen -> feature hook -> feature api -> typed Supabase client
```

Screens should stay declarative. Supabase calls belong in feature API modules, not directly in route components.

## Prerequisites

- Node.js compatible with the Expo SDK in this project
- npm
- Expo CLI through `npx expo`
- EAS CLI through `npx eas`
- Supabase CLI
- Docker, required for the local Supabase stack
- iOS Simulator/Xcode and/or Android Studio for local native testing

Use `npm install` from the repository root. This project uses `package-lock.json`; keep npm as the package manager unless the team intentionally migrates.

## Environment Setup

Create a local `.env` from the sample file:

```bash
cp .env.example .env
```

Required app runtime variables:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Recommended internal build variables:

```bash
EXPO_PUBLIC_EAS_PROJECT_ID=
EXPO_PUBLIC_APP_ENV=development
```

Optional monitoring variable:

```bash
EXPO_PUBLIC_SENTRY_DSN=
```

Do not put private credentials in `.env`. In particular, never expose Supabase `service_role` keys, Sentry upload tokens, webhook secrets, cron secrets, or admin credentials through `EXPO_PUBLIC_*` variables.

Edge Function environment values are documented separately in `supabase/functions/.env.example`. Function-only secrets such as `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `EDGE_FUNCTION_SECRET`, and `EXPO_ACCESS_TOKEN` belong in Supabase/EAS/CI secret storage, not in the mobile app runtime environment.

## Local Development

Install dependencies:

```bash
npm install
```

Start the Expo dev server:

```bash
npm run start
```

Run a platform target:

```bash
npm run ios
npm run android
npm run web
```

For native modules and notification testing, use a development or preview build rather than Expo Go.

## Supabase Workflow

Start the local Supabase stack:

```bash
npm run supabase:start
```

Reset the local database and apply migrations plus seed data:

```bash
npm run supabase:reset
```

Run local database/RLS tests:

```bash
npm run supabase:test
```

Generate TypeScript database types from the local schema:

```bash
npm run supabase:types
```

Stop local services:

```bash
npm run supabase:stop
```

Database rules:

- Create schema changes through Supabase CLI migrations.
- Keep RLS enabled on exposed tables.
- Use membership-aware policies, not broad `TO authenticated` access.
- Keep privileged server workflows in RPCs or Edge Functions with explicit authorization checks.
- Regenerate and commit `src/lib/supabase/database.types.ts` after schema changes.

## Quality Gates

Run these before merging code changes:

```bash
npm run typecheck
npm run lint
npm test
```

Run the local Supabase privacy suite when database, RLS, storage, auth, notification, account safety, or media behavior changes:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test
```

For release candidates and internal builds, follow:

- `docs/qa-plan.md`
- `docs/manual-test-checklist.md`
- `docs/rls-test-plan.md`
- `docs/privacy-review-checklist.md`
- `docs/internal-distribution.md`
- `docs/release-checklist.md`

Any privacy failure is a release blocker.

## EAS Builds

Configured profiles live in `eas.json`:

- `development`: internal development client
- `preview`: internal QA distribution
- `production`: store distribution with auto-increment

Internal QA build commands:

```bash
npx eas build --platform ios --profile development
npx eas build --platform android --profile development
npx eas build --platform ios --profile preview
npx eas build --platform android --profile preview
```

Do not use the production profile or run `eas submit` without explicit release-owner approval and completed release signoff.

## Observability

Sentry initializes only when `EXPO_PUBLIC_SENTRY_DSN` is set. Monitoring events are sanitized before send, user context is limited to user ID, request headers/cookies/query strings are stripped, and known sensitive keys such as tokens, invite codes, signed URLs, storage paths, private notes, and ritual responses are redacted.

Build-time Sentry source map upload values must be configured as EAS/CI secrets:

```bash
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

Do not commit these values.

## Security And Privacy Checklist

Before changing sensitive flows, verify that the change preserves these invariants:

- A user can only access their own profile and active couple data.
- A third user cannot join, read, infer, or subscribe to another couple space.
- Locked capsule content remains hidden until the data-layer open workflow allows access.
- Partner ritual response content remains hidden until both partners complete the same occurrence.
- Push payloads, logs, Sentry events, and timeline rows never include private locked content or unrevealed responses.
- Account deletion, export, unpair, and notification preference flows are user-scoped.
- Service role keys are used only in trusted server contexts.

## Documentation Map

- Product scope and non-goals: `docs/product-spec.md`
- Technical architecture: `docs/architecture.md`
- Database design: `docs/database.md`
- RLS policies: `docs/rls-policies.md`
- QA plan: `docs/qa-plan.md`
- Manual test checklist: `docs/manual-test-checklist.md`
- Internal distribution: `docs/internal-distribution.md`
- Release checklist: `docs/release-checklist.md`
- Privacy policy draft: `docs/privacy-policy.md`
- Store data deletion artifact: `docs/store-data-deletion.md`
- Roadmap and prioritization: `docs/roadmap-prioritization.md`

## Release Status

This repository is configured for internal QA distribution. Public App Store or Google Play submission remains blocked until release, privacy, RLS, account deletion/export, data safety, and internal device signoff are complete.
