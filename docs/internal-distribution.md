# Tara Internal Distribution Guide (Phase 14F/14G)

This guide is for **internal QA distribution only**.  
No public App Store / Play Store release is allowed in this phase.

## 1) Setup

- [ ] Expo/EAS CLI available:
  - `npx eas --version`
- [ ] Logged in to Expo:
  - `npx eas login`
- [ ] Local `.env` created from `.env.example` with required public values:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `EXPO_PUBLIC_EAS_PROJECT_ID` (fallback)
  - `EXPO_PUBLIC_APP_ENV` (`development` or `preview` for internal testing)
- [ ] Optional Sentry ingestion value configured if needed:
  - `EXPO_PUBLIC_SENTRY_DSN`
- [ ] Build-time Sentry upload secrets are configured only in EAS/CI, never committed:
  - `SENTRY_AUTH_TOKEN`
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`

Current identifiers to verify against `app.json`:

| Field | Current value |
| --- | --- |
| App name | `Tara` |
| Slug | `tara` |
| Version | `1.0.0` |
| Scheme | `tara` |
| iOS bundle identifier | `com.leader282.tara` |
| iOS build number | `1` |
| Android package | `com.leader282.tara` |
| Android version code | `1` |
| EAS project ID | `3951340e-8d4b-45a1-aa19-2acd80c69ddf` |

`app.json` is the canonical source for build identifiers; `EXPO_PUBLIC_EAS_PROJECT_ID` is only a runtime fallback value.

## 2) EAS build commands

Use only internal profiles for QA:

```bash
# Development client builds
npx eas build --platform ios --profile development
npx eas build --platform android --profile development

# Preview QA builds
npx eas build --platform ios --profile preview
npx eas build --platform android --profile preview
```

Do not use `production` profile unless explicit release-owner approval is recorded.

## 3) Installing builds

- iOS:
  - Install from EAS build link.
  - Register tester UDIDs if prompted.
- Android:
  - Install from EAS build link/QR artifact on physical device.
- Confirm startup, auth, and root-route gating before starting deeper QA.

## 4) Test accounts

Use dedicated internal accounts only.

- Minimum:
  - `QA Partner A`
  - `QA Partner B`
- Recommended:
  - `QA Outsider` account for isolation checks.
- Rules:
  - Do not use personal/private real-couple data.
  - Do not use production user credentials.
  - Use synthetic content for capsules/rituals/media.

## 5) Device matrix

Minimum matrix per release candidate:

- [ ] iOS physical device (current supported OS baseline)
- [ ] Android physical device (current supported OS baseline)
- [ ] Cross-device paired flow (A on iOS, B on Android or vice versa)
- [ ] At least one cross-timezone scenario for quiet-hours and notification checks

Recommended coverage expansions:

- Older iOS version still in support range.
- Lower-end Android hardware for performance sanity checks.
- Low-connectivity scenario (airplane mode toggles/reconnect).

## 6) Known limitations for internal testing

- Data export is currently request-based placeholder (not immediate downloadable file generation).
- Account deletion processing requires controlled worker/secret setup validation.
- Notification workers may be environment-dependent if scheduling/secrets are incomplete.
- No mobile E2E automation yet; manual checklist execution is required.

## 7) Tester issue reporting

Every issue should include:

- Build identifier (platform + profile + build link/id).
- Device model + OS version.
- Test account role used (Partner A/B/Outsider).
- Reproduction steps (numbered, deterministic).
- Expected vs actual behavior.
- Screenshot/video if relevant.
- Severity:
  - `P0`: privacy/data leak, auth bypass, crash loop.
  - `P1`: core flow break (auth, pairing, rituals, capsules, timeline, account safety).
  - `P2`: non-blocking UX defect.

Suggested labels:

- `internal-qa`
- `ios` / `android`
- `privacy` / `rls` / `notifications` / `account-safety` / `performance`

## 8) No public release yet

- [ ] Internal QA signoff completed.
- [ ] Privacy and RLS checklists completed.
- [ ] Release owner confirms internal-only distribution remains in effect.
- [ ] No TestFlight external group rollout and no Play production rollout performed.

## 9) Phase 14G smoke-pass commands

Run these before requesting testers to install internal builds:

```bash
# Static and unit checks
npm run typecheck
npm run lint
npm test -- --runInBand

# Local Supabase checks (when local stack is available)
npm run supabase:status
npm run supabase:reset
npm run supabase:test

# Expo/EAS preflight
npx expo-doctor --verbose
npx eas --version
npx eas whoami --non-interactive
npx eas build:list --limit 3 --non-interactive
```

Only run real builds after explicit local approval in Cursor:

```bash
npx eas build --platform ios --profile preview
npx eas build --platform android --profile preview
```

Never run `eas submit` in internal-distribution phases.

## 10) Current caveats

- Splash config is now defined through the `expo-splash-screen` plugin. Keep `expo-splash-screen` installed when editing app config.
- `expo-doctor` can still report Expo SDK package version drift (for example patch-level Expo package updates and `@types/jest`). Use `npx expo install --check` before release hardening.
- EAS currently warns that `cli.appVersionSource` is unset in `eas.json`; this is not a current build blocker but will become required in a future EAS CLI release.
