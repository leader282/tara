# Tara Manual Test Checklist (Phase 14F)

Use this checklist for internal QA on real devices. Complete with at least two users (Partner A and Partner B) and preferably one outsider account.

## Pre-test setup

- [ ] Build installed from internal profile (`development` or `preview`), not Expo Go.
- [ ] Partner A and Partner B accounts are available.
- [ ] Devices have distinct timezones for notification/quiet-hours checks (recommended).
- [ ] Optional outsider account is ready for isolation checks.

## 1) Auth (sign-up, sign-in, sign-out)

- [ ] Partner A can sign up and land in onboarding.
- [ ] Partner A can sign out and is redirected to auth flow.
- [ ] Partner A can sign in again and session restores correctly.
- [ ] Invalid credentials show calm, non-sensitive error copy.

## 2) Onboarding

- [ ] Profile step saves display name/timezone/city/country/birthday.
- [ ] Emotional preferences step saves tone, preferred love signals, and notification tone.
- [ ] Quiet hours step validates required times when enabled.
- [ ] Complete step returns user to root and routes to invite/couple gate correctly.

## 3) Couple create/invite/accept

- [ ] Partner A can create a couple and receives an invite code.
- [ ] Partner A waiting state appears until Partner B joins.
- [ ] Partner B can accept invite and both land in paired state.
- [ ] Invalid/expired/used code is rejected with non-enumerating messaging.
- [ ] Third-user join attempt is rejected.

## 4) Couple home/countdown

- [ ] Paired home loads partner card, local time card, and reunion countdown card.
- [ ] Edit meetup updates countdown date/location and persists.
- [ ] Home actions route correctly to rituals, capsules, timeline, and settings.

## 5) Presence pulses/realtime

- [ ] Partner A sends pulse; Partner B sees realtime incoming pulse toast while online.
- [ ] Recent pulses list updates for both partners.
- [ ] Outsider cannot observe couple pulses through app UI.

## 6) Rituals/reveal behavior

- [ ] Today ritual renders for both partners.
- [ ] Partner A can submit a ritual response.
- [ ] Partner B cannot see Partner A response text/media before completing own response.
- [ ] After both complete, both responses become visible.

## 7) Memory capsules/unlock

- [ ] Partner A can create capsule with future unlock date.
- [ ] Locked capsule metadata is visible to partner, but private content is not.
- [ ] Creator can still view own pre-unlock content preview.
- [ ] Capsule cannot open before unlock time.
- [ ] Capsule opens after unlock and both partners can view opened content.

## 8) Timeline

- [ ] Timeline loads in paired state and supports refresh/pagination.
- [ ] Presence, ritual, capsule, and countdown entries appear with safe summaries.
- [ ] Timeline item taps navigate to expected destination screens.
- [ ] No private locked capsule note text appears in timeline cards.

## 9) Media upload/access

- [ ] Photo picker flow works on both iOS and Android physical devices.
- [ ] Upload progress and failure states are surfaced clearly.
- [ ] Private image rendering uses signed URL access and loads for authorized user.
- [ ] Partner cannot access media tied to unrevealed ritual response.
- [ ] Partner cannot access media tied to locked capsule before open.

## 10) Notifications

- [ ] Notification permission prompt and denied/granted states are handled correctly.
- [ ] Push token registration succeeds when permission is granted.
- [ ] Notification preference toggles persist across app restart.
- [ ] Quiet-hours toggle and time windows persist.
- [ ] If worker environment is enabled, notification deep links route to expected screens.

## 11) Settings/profile/quiet hours

- [ ] Profile settings save and reload.
- [ ] Emotional settings save and reload.
- [ ] Quiet-hours settings save and reload.
- [ ] Couple settings save and remain unavailable for unpaired users.

## 12) Unpair

- [ ] Unpair confirmation requires exact `UNPAIR` text.
- [ ] Successful unpair returns user to invite flow.
- [ ] Couple-scoped content no longer appears after unpair.

## 13) Account deletion request/cancel

- [ ] Deletion request requires exact `DELETE` text.
- [ ] Request creates pending status with scheduled metadata.
- [ ] Pending request can be canceled.
- [ ] User cannot cancel another user's request.

## 14) Data export request

- [ ] Data export request action is available from account safety.
- [ ] Latest request status appears in account safety.
- [ ] UI clearly communicates placeholder behavior (no immediate file generation).

## 15) Offline/error states

- [ ] Network loss during auth/pairing/mutations shows recoverable errors.
- [ ] Retry controls work on key error states (home, rituals, capsules, timeline).
- [ ] App does not crash when reopening after temporary connectivity loss.

## 16) Sign-out cache clearing

- [ ] Sign out from paired state returns to auth flow.
- [ ] Sign in as a different user does not show previous user's couple data.
- [ ] Timeline/capsules/rituals queries are refreshed for the new session.
- [ ] Push token unregister is attempted during sign-out (best effort) and app sign-out still succeeds if it fails.
