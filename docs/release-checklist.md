# Tara Release Checklist (Phase 14F)

This checklist is for QA/release hardening only.  
Phase 14F does **not** include public store submission.

## Release scope confirmation

- [ ] This release includes documentation, QA hardening, and reliability validation only.
- [ ] No new product features were added as part of the release candidate.
- [ ] Product behavior changes are limited to bug fixes and safety/privacy corrections.
- [ ] Build metadata records who signed off and which commit/build was validated.

## 1) App config and branding assets

- [ ] `app.json` app identity fields are reviewed: `name`, `slug`, `scheme`, orientation, version.
- [ ] iOS metadata is reviewed: `bundleIdentifier`, `buildNumber`.
- [ ] Android metadata is reviewed: `package`, `versionCode`.
- [ ] `eas.projectId` is present and matches the intended Expo project.
- [ ] Icon assets exist and render correctly:
  - [ ] `assets/icon.png`
  - [ ] `assets/adaptive-icon.png`
- [ ] Splash asset exists and renders correctly:
  - [ ] `assets/splash-icon.png`
- [ ] Any placeholder branding is explicitly marked before store submission.

## 2) Observability and error reporting

- [ ] Sentry initialization is validated for the target environment (`EXPO_PUBLIC_SENTRY_DSN` set where expected).
- [ ] Sentry release/environment tagging is validated.
- [ ] Sentry symbol/source map upload secrets are configured only in EAS/CI secrets:
  - [ ] `SENTRY_AUTH_TOKEN`
  - [ ] `SENTRY_ORG`
  - [ ] `SENTRY_PROJECT`
- [ ] Logs and monitoring payloads are validated to avoid private content leakage.

## 3) Supabase backend readiness

- [ ] Supabase migrations are applied and verified in target environments.
- [ ] Schema drift check has been completed before internal QA signoff.
- [ ] RLS policy checks are executed (see `rls-test-plan.md`).
- [ ] Edge Functions required for current flows are deployed and verified:
  - [ ] `process-notification-queue`
  - [ ] `check-push-receipts`
  - [ ] `process-account-deletion-requests`
- [ ] Edge Function secrets are configured in function env only (`CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, optional `EXPO_ACCESS_TOKEN`).
- [ ] Service role keys are not present in app runtime envs.

## 4) Push and notifications readiness

- [ ] Push credentials are configured for iOS and Android internal builds.
- [ ] Notification permission flow works on physical devices.
- [ ] Push token registration/unregistration flow works and is user-scoped.
- [ ] Notification content remains privacy-safe (no notes, ritual responses, or locked capsule content).
- [ ] Quiet-hours behavior is verified for recipient-side scheduling rules.

## 5) Privacy, compliance, and store policy artifacts

- [ ] Privacy policy is live, accurate, and linked (draft artifact: `privacy-policy.md`).
- [ ] App Store Connect account deletion requirement is satisfied:
  - [ ] In-app account deletion request/cancel flow is present.
  - [ ] Support/help text and policy references match implemented behavior.
- [ ] Google Play data deletion requirement is satisfied:
  - [ ] In-app deletion path is present.
  - [ ] Public data deletion URL/process is documented for Play listing (evidence artifact: `store-data-deletion.md`).
- [ ] App Store privacy labels and Google Play Data Safety answers are updated to match real collection/use.
- [ ] No exact GPS collection is disclosed because exact GPS is not used in MVP.

## 6) QA execution and signoff

- [ ] QA plan has been executed (`qa-plan.md`).
- [ ] Manual critical path checklist has been executed (`manual-test-checklist.md`).
- [ ] Privacy review checklist has been executed (`privacy-review-checklist.md`).
- [ ] RLS test plan has been executed (`rls-test-plan.md`).
- [ ] Internal distribution checklist has been executed (`internal-distribution.md`).
- [ ] Internal tester signoff is recorded for at least:
  - [ ] One physical iOS device
  - [ ] One physical Android device
  - [ ] Two-account paired flow

## 7) Known deferred items (must remain explicit)

- [ ] Data export remains request-based placeholder until file generation is production-verified.
- [ ] Account deletion processor destructive mode remains gated and validated in controlled environments.
- [ ] Notification worker scheduling/ops hardening remains tracked if not fully enabled in all environments.
- [ ] Full public-store submission checklist remains deferred to Phase 15.
- [ ] Any additional deferred item found during QA is added to release notes before signoff.

## 8) Do-not-submit-until list

Do **not** submit to public stores until all of the following are true:

- [ ] Couple isolation is verified (no cross-couple data access).
- [ ] No broad authenticated RLS reads on private tables.
- [ ] Locked capsule content does not leak before unlock/open.
- [ ] Unrevealed ritual response data does not leak before reveal.
- [ ] Push payloads and logs/Sentry contain no private content.
- [ ] Account deletion and cancellation flows work end-to-end.
- [ ] Data export request flow is available and clearly labeled.
- [ ] Apple account deletion requirement evidence is complete.
- [ ] Google Play data deletion requirement evidence is complete.
- [ ] Privacy policy + Data Safety/Privacy labels are finalized and accurate.
- [ ] Internal distribution signoff is complete and documented.
- [ ] Product owner approval explicitly allows moving beyond internal-only distribution.
