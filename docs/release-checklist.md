# Tara Release Checklist (Phase 14F)

This checklist is for QA/release hardening only.  
Phase 14F does **not** include public store submission.

## 1.1.0 internal build

Ships the redesigned UI, the fixes found in two-device E2E testing, live couple updates, and the
new notification copy. Distribution stays internal; the public-store gates below still apply.

Already done on the hosted project: migrations through
`20261121152018_couple_live_updates.sql` are applied, and `process-notification-queue` runs the
new copy and sound rules. CI is green on `main`, and the two-device Maestro journey passed 32/32
on a release build (before live couple updates landed).

- [ ] `supabase migration list --linked` shows no local migration missing from the hosted project.
- [ ] The journey passes on a fresh release build: `npm run e2e:build:android`, install the APK on
      both emulators, then `npm run e2e:maestro:journey -- --build release` (see `.maestro/README.md`).
- [ ] Version is `1.1.0` (Android `versionCode` 2, iOS `buildNumber` 2). The runtime version follows
      the app version, so over-the-air updates for 1.1.0 never reach 1.0.0 builds.
- [ ] The EAS `preview` environment defines `EXPO_PUBLIC_SUPABASE_URL`,
      `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `EXPO_PUBLIC_SENTRY_DSN` (`eas env:list --environment preview`).
      EAS doesn't upload the gitignored `.env`, and the app stops at launch without the Supabase values.
- [ ] `eas build --profile preview --platform android`, then install over 1.0.0 on both partners' phones.
      iOS builds for devices need a paid Apple Developer account.

On two physical phones signed in as a couple:

- [ ] Pushes arrive for a pulse, a revealed ritual, an unlocked capsule, and the daily ritual reminder
      (13:30 UTC); only partner-initiated ones play a sound, and none show notes or answers.
- [ ] Quiet hours hold pushes until they end.
- [ ] A reunion edit and an unpair on one phone show up on the other without a refresh.
- [ ] A photo capsule uploads from the gallery and from the camera, and opens on the other phone.
- [ ] The new fonts, icons, and splash screen render correctly on iOS and Android.
- [ ] Sentry shows no new errors for release `tara@1.1.0`.

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

## 8) Post-MVP decision gate

- [ ] Internal tester feedback has been reviewed (`experiments.md` outputs consolidated).
- [ ] Privacy issues from internal testing are triaged with owners and severity.
- [ ] RLS test gaps found during internal validation are resolved or explicitly blocked with owner signoff.
- [ ] Deletion/export processor status is checked (including destructive-mode verification state and known limitations).
- [ ] Next feature phase is selected and documented based on validation evidence; default remains Phase 16 Comfort Kit unless the roadmap is explicitly re-scored.
- [ ] No unresolved S0 privacy/security debt remains before Phase 16 implementation starts.
- [ ] AI and monetization remain deferred research tracks with no implementation commitment in the next phase.
- [ ] No new feature work starts before unresolved Phase 14 blockers are closed or explicitly waived by product + privacy/security owners.

## 9) Do-not-submit-until list

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
