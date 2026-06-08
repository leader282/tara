# Tara QA Plan (Phase 14F)

This plan defines the minimum QA layers for release candidates in Phase 14F and Phase 15.

## Scope and intent

- Focus on reliability, privacy, and release documentation hardening.
- Validate implemented flows only; no new feature work is implied by this plan.
- Treat couple isolation and privacy as hard release gates.

## Testing layers

### 1) Typecheck

- Command: `npm run typecheck`
- Goal: catch TypeScript regressions before runtime.
- Required for code changes; optional for docs-only changes.

### 2) Lint

- Command: `npm run lint`
- Goal: keep code quality and static checks consistent.
- Required for code changes; optional for docs-only changes.
- There is no dedicated docs lint script in this repository.

### 3) Unit tests

- Command: `npm test`
- Current focus: validation schemas, date helpers, timeline payload sanitization, notification route resolution.
- Unit tests are required for release candidates touching business logic.

### 4) Component tests

- Command examples:
  - `npm test -- __tests__/components`
  - `npm test -- __tests__/features`
- Current focus: UI primitives and privacy-sensitive reveal states (ritual and capsule surfaces).

### 5) Supabase DB/RLS tests

- Command examples (local database only):
  - `npm run supabase:start`
  - `npx supabase test db --local supabase/tests`
  - `npx supabase test db --local supabase/tests/rls_profiles.test.sql`
- Goal: prove row-level isolation, reveal gating, and non-readable worker tables.

### 6) Real-device manual tests

- Required setup:
  - At least 2 physical devices (iOS + Android preferred).
  - At least 2 accounts (Partner A and Partner B), plus optional outsider account.
- Follow `manual-test-checklist.md` for critical path validation.

### 7) Internal distribution testing

- Build profiles: `development` and `preview` only.
- Test execution and signoff rules live in `internal-distribution.md`.
- Store submission is explicitly out of scope for this phase.

## Pass/fail rules

- A release candidate passes only when all required layers for its change type pass.
- Any privacy failure is an automatic fail:
  - Cross-couple data visibility.
  - Locked capsule leakage.
  - Unrevealed ritual response leakage.
  - Broad authenticated RLS read on private data.
- Any account safety failure is an automatic fail:
  - Unpair archiving inconsistencies.
  - Deletion request/cancel flow mismatch.
  - Export request flow unavailable without fallback messaging.
- Internal distribution signoff must include:
  - Device matrix coverage completed.
  - Manual checklist completed.
  - Known limitations documented and accepted.

## Known limitations

- No mobile end-to-end automation yet; critical user journeys remain manual.
- Jest coverage exists but is still limited to selected unit/component layers.
- Data export is currently a request placeholder, not immediate downloadable export generation.
- Account deletion processing uses server-side worker flow that requires controlled environment verification.
- Notification workers are present but require environment secrets/scheduling to be fully operational in each environment.
- No dedicated markdown/docs linting pipeline currently exists.
