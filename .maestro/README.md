# Maestro E2E Tests

This directory contains Tara's Maestro end-to-end suite. It covers the first-run
smoke path plus seeded paired-user flows that can run against one emulator or a
coordinated Android/iOS pair.

## Prerequisites

- Install Maestro: `curl -Ls "https://get.maestro.mobile.dev" | bash`
- Start local Supabase: `npm run supabase:start`
- Run the app in an iOS simulator or Android emulator with the native app id
  `com.leader282.tara`.
- Export a Supabase service-role key for test data setup and cleanup:

```sh
export E2E_SUPABASE_URL="http://127.0.0.1:54321"
export E2E_SUPABASE_SERVICE_ROLE_KEY="<local service_role key from supabase status>"
```

If Maestro was just installed in the current terminal, refresh PATH before running
tests:

```sh
export PATH="$PATH:$HOME/.maestro/bin"
```

For local Supabase, make sure the app env points at the local API before launching
the app:

- iOS simulator can use `http://127.0.0.1:54321`.
- Android emulator usually needs `http://10.0.2.2:54321`.

The first smoke test creates a fresh email address at runtime, so it does not need
database reset between runs. Resetting Supabase is still recommended when debugging
stateful failures:

```sh
npm run supabase:reset
```

## Run The Full Suite

List booted devices:

```sh
maestro list-devices
```

Then run the full suite with one or both device ids:

```sh
E2E_ANDROID_DEVICE="emulator-5554" \
E2E_IOS_DEVICE="00000000-0000-0000-0000-000000000000" \
npm run e2e:maestro:full
```

If both devices are provided, the runner starts a real cross-device realtime test:
Android signs in as one partner and waits while iOS signs in as the other partner
and sends a presence pulse through Supabase Realtime.

## Run The Two-Device Journey

`journey/` drives two Android emulators as two partners from a fresh sign-up through every
feature: onboarding choices, pairing (bad code, real code, waiting screen), live pulses in both
directions, reunion planning, ritual reveal, text and photo capsules (locked, unlocked, opened),
timeline, every settings screen, notification permission, data export, unpair, rejoining through
the invite link, sign-out, and an unknown link. Steps continue from the state the previous step
left, so they run in order, and "live" steps keep one phone watching while the other acts.

```sh
E2E_SUPABASE_URL="http://127.0.0.1:54321" \
E2E_SUPABASE_SERVICE_ROLE_KEY="<local service_role key from supabase status>" \
npm run e2e:maestro:journey -- --device-a emulator-5554 --device-b emulator-5556
```

Add `--keep-data` to inspect a failed run and `--from-step <n> --run-id <id>` to resume it.
Capsules can only be created with a future unlock time, so the runner moves a capsule's unlock
time into the past in the database to stand in for the wait.

Both runners prepare emulators before testing: they turn off the autofill service (its save
password sheet covers the app), force the on-screen keyboard even with a hardware keyboard,
turn off stylus handwriting (Gboard otherwise treats Maestro's injected touches as a stylus and
shows a toolbar that lets Back through to the app), and turn off system animations. The AVDs
should also have `hw.keyboard = no`. On Android, `shared/launch-app.yaml` connects the dev
client straight to Metro at `10.0.2.2:8081` instead of relying on server discovery.

The runners also install Maestro's Android driver once per device and run every flow with
`--no-reinstall-driver`. By default Maestro installs and uninstalls the driver for every
session, which costs minutes per run and, on a busy emulator, can outlast its startup timeout.

Long runs slow emulators down; cold-boot them before a full journey
(`emulator -avd <name> -no-snapshot-load`) and keep the machine otherwise idle while it runs.

### Testing a release build

Both runners default to the dev client on Metro (`--build dev`). A release build starts in
seconds, renders much faster than the debug build, and has no dev launcher or dev menu to get
in the way, so runs are quicker and steadier:

```sh
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<local publishable key from supabase status>" \
npm run e2e:build:android
adb -s emulator-5554 install -r .maestro/.e2e-data/tara-e2e-release.apk
adb -s emulator-5556 install -r .maestro/.e2e-data/tara-e2e-release.apk
npm run e2e:maestro:journey -- --device-a emulator-5554 --device-b emulator-5556 --build release
```

The build script only builds against local Supabase (`http://10.0.2.2:54321` by default). It
turns EAS Update off for that build, since an over-the-air update would replace the bundle with
the production one, and allows the local stack's plain-HTTP traffic. Rebuild after app changes.
The APK replaces the dev client on the emulator (same package); reinstall the debug build to go
back.

To keep generated test data after a failure:

```sh
E2E_KEEP_DATA=1 npm run e2e:maestro:full
```

Cleanup can be run manually:

```sh
npm run e2e:maestro:data:cleanup
npm run e2e:maestro:data:cleanup:all
```

`cleanup:all` removes users whose emails start with `tara.e2e.` or `tara.e2e+`
and ritual templates whose titles start with `E2E `. Do not use that prefix for
manual data you want to keep.

## Quick Runs

The original smoke path still runs standalone:

```sh
npm run e2e:maestro:smoke:android
npm run e2e:maestro:smoke
```

Seeded data can be created without running Maestro:

```sh
E2E_RUN_ID="debug1" npm run e2e:maestro:data:setup
E2E_RUN_ID="debug1" npm run e2e:maestro:data:cleanup
```

## Android Dev Build Notes

The smoke flow was first verified against the `TaraPhone` Android emulator. For
local Supabase, start the Android dev build with env overrides instead of editing
your checked-in `.env`:

```sh
EXPO_NO_DOTENV=1 \
EXPO_PUBLIC_SUPABASE_URL="http://10.0.2.2:54321" \
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<local publishable key from supabase status>" \
npx expo run:android
```

If Android install fails with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, uninstall the
old emulator build and reinstall:

```sh
adb uninstall com.leader282.tara
npx expo run:android
```

## Current Coverage

`smoke/onboarding-create-couple.yaml` verifies:

- app launches to sign-in when signed out
- account creation works against the configured Supabase project
- profile, emotional preference, quiet-hours, and completion onboarding screens advance
- couple space creation succeeds
- active invite screen renders an invite code

`e2e/invite-acceptance.yaml` verifies:

- seeded invitee can reach the invite flow after sign-in
- invalid invite code shows a friendly error
- valid seeded invite code pairs the user and opens couple home

`e2e/paired-core.yaml` verifies:

- paired couple home loads for either partner
- presence pulse send path succeeds
- today's ritual loads from seeded data and accepts a text answer
- locked/revealed ritual branches are handled depending on partner progress
- seeded ready capsule opens and reveals content
- UI-created future capsule is saved and visible
- timeline and settings/privacy/account surfaces load

`e2e/account-safety.yaml` verifies:

- paired account status renders
- data export request path creates an active request
- account deletion request can be submitted and canceled
- unpair confirmation archives the active couple and returns to invite setup

`realtime/android-wait-for-pulse.yaml` and `realtime/ios-send-pulse.yaml` verify:

- Android and iOS run as separate partners at the same time
- iOS sends a real presence pulse through Supabase
- Android receives the partner pulse via realtime UI

## Cleanup Contract

The full runner uses `scripts/e2e/supabase-e2e-data.mjs` to create isolated test
users, couples, invite codes, ritual templates, and capsules. The runner always
calls cleanup in a `finally` block unless `E2E_KEEP_DATA=1` is set.

Cleanup deletes test couples before auth users because shared tables reference
`created_by` without cascade. It also deletes account safety/export rows and
run-scoped ritual templates.

## Native Coverage Still Manual

These cases need additional app affordances or native infrastructure before they
can be automated reliably:

- camera capture (the journey covers the gallery picker and private photo upload)
- push notification delivery across APNs/FCM: the app only registers push tokens on
  physical devices, so on emulators the journey checks the permission prompt and the
  "requires a physical device" message, and the queue can be checked server-side
- what happens after picking a share target (the journey only checks that the share sheet
  opens with the invite message)
- exact offline/network-failure branches
