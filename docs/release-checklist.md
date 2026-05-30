# Tara — Release Checklist (Phase 0)

> **Living document.** This is a Phase 0 placeholder for launch readiness. Expand and verify each section during implementation; **Phase 14** owns reliability/QA depth; **Phase 15** owns final sign-off. Do not treat unchecked items as shipped.

---

## 1. Purpose

- [ ] Confirm every release candidate is evaluated against the [product promise](product-spec.md): *"Tara helps long-distance couples feel together even when they are apart."*
- [ ] Use this checklist before any external beta, TestFlight/Play internal track, or production cut.
- [ ] Block release on any **must-pass** privacy or couple-isolation failure (see [product-spec §14](product-spec.md)).
- [ ] Record who signed off and the build/commit hash for each section completed.

---

## 2. Pre-MVP release philosophy

- [ ] Ship the **smallest polished core** (emotional loop), not feature volume.
- [ ] Prefer **fewer, warmer** interactions over engagement metrics (no streaks, no guilt copy).
- [ ] **Privacy and emotional safety are release gates**, not polish items.
- [ ] Enforce isolation in **Postgres RLS + Storage policies**, not only in the client ([architecture](architecture.md), [rls-policies](rls-policies.md)).
- [ ] Defer optional infrastructure until the core loop is healthy (analytics, monetization, advanced Edge orchestration — [architecture §17](architecture.md)).
- [ ] Respect phase boundaries: **Phase 1 is foundation/bootstrap only**; product feature flows begin in later phases ([architecture §16](architecture.md)).
- [ ] **No monetization in MVP** — no subscriptions, paywalls, RevenueCat, or in-app purchases ([product-spec §8](product-spec.md)).

---

## 3. Product safety checklist

- [ ] No guilt, surveillance, or pressure mechanics in UI copy or flows ([product-spec §8–9](product-spec.md)).
- [ ] Missing a day / skipped ritual has **no penalty** messaging.
- [ ] No "your partner hasn't replied," read-receipt, or last-seen semantics by default.
- [ ] Presence is **intentional** (user sends a signal), never ambient broadcast.
- [ ] Supportive tone in errors and empty states — never shaming or clinical framing.
- [ ] Unpaired users see only calm invite/onboarding states, not couple data.
- [ ] Feature set matches MVP scope; post-MVP roadmap items are not half-shipped.

---

## 4. Privacy checklist

- [ ] **No public data exposure** — no public profiles, feeds, share links, or discoverable content.
- [ ] **Private by default** — safe settings are defaults, not opt-in-only safety.
- [ ] **Data minimization** — collect only what each feature needs ([product-spec §12](product-spec.md)).
- [ ] **No exact GPS tracking** in MVP — no coordinates, location history, or live GPS architecture ([database §2](database.md)).
- [ ] Location fields (if any) are **coarse human-entered labels** only (city/country/meetup label).
- [ ] Media uploads avoid or strip EXIF GPS before storage ([database §media_assets](database.md)).
- [ ] Export and delete account/data flows work and are documented (Phase 13+).
- [ ] No AI reading of capsules, timeline, or signals in MVP.

---

## 5. RLS checklist

- [ ] RLS enabled on **every** exposed application table before client access ([rls-policies §2](rls-policies.md)).
- [ ] **No broad authenticated reads** — no policy equivalent to "authenticated users can `SELECT` all rows" on private tables.
- [ ] Only `ritual_templates` may be broadly readable by authenticated users (preset reference data only).
- [ ] All shared rows scoped by `couple_id` + **active** membership (`is_active_couple_member`).
- [ ] Clients cannot directly insert `couples`, `couple_members`, or accept invites outside RPCs.
- [ ] `create_couple_with_invite` and `accept_couple_invite` are transactional; max **two** active members enforced at DB layer.
- [ ] Locked `memory_capsule_contents` unreadable by partner until controlled open-state rules match RPC.
- [ ] Partner ritual `response_text` hidden until both partners complete the same occurrence.
- [ ] Timeline rows for locked capsules contain **metadata only** — no private note text or revealing paths.
- [ ] Phase 2+ **automated RLS tests** pass (partner A, partner B, outsider C — [rls-policies §11](rls-policies.md)).
- [ ] `service_role` keys are **never** in the mobile bundle ([architecture §8](architecture.md)).

---

## 6. Authentication checklist

- [ ] Sign-up, sign-in, and session refresh work on supported auth methods.
- [ ] Session/bootstrap runs once at app root; route guards enforce auth before couple routes.
- [ ] Unauthenticated users cannot access couple-scoped API routes or Storage objects.
- [ ] Account recovery flow documented and tested (per [architecture](architecture.md) / open questions).
- [ ] Sign-out clears local session and invalidates client caches appropriately.
- [ ] Auth errors map to calm, user-safe copy ([architecture §13](architecture.md)).

---

## 7. Couple pairing checklist

- [ ] User can create a couple space and receive a **single-use, time-limited** invite.
- [ ] Second partner can join via invite; couple has **exactly two** active members afterward.
- [ ] Third join / second active couple for same user is **rejected** at database layer.
- [ ] Expired, revoked, and accepted invites cannot be reused.
- [ ] Invite errors are non-enumerating ("invite no longer available") — no couple metadata leakage.
- [ ] Creator cannot accept their own invite as the second partner.
- [ ] Unpaired state shows no shared timeline, pulses, or capsules.

---

## 8. Capsule privacy checklist

- [ ] Private content lives in `memory_capsule_contents`, not capsule metadata rows.
- [ ] Partner cannot read locked content via API, joins, Storage URLs, or Realtime before the capsule is open.
- [ ] `open_memory_capsule` (or equivalent) is the controlled path to open state; rules match RLS.
- [ ] Scheduled capsules cannot open before `unlock_at`.
- [ ] Open timeline events do not duplicate note text or media paths.
- [ ] Storage bucket `couple-media` is **private**; object access matches capsule open state.
- [ ] Signed URLs (if used) are short-lived and authorized post-check.

---

## 9. Ritual privacy checklist

- [ ] No streak counters or penalty fields in schema or UI.
- [ ] User sees own `ritual_completions` immediately; partner response only after **both** complete same occurrence.
- [ ] Realtime (if enabled) does not broadcast hidden `response_text` early.
- [ ] Ritual reminders respect recipient quiet hours when notifications ship (see §10).

---

## 10. Notification safety checklist

- [ ] **Quiet hours respected before notifications ship** — defer to recipient local window; nothing wakes them by default ([product-spec §11.10, §13](product-spec.md)).
- [ ] Recipient timezone + `user_settings` quiet hours win over sender intent and couple defaults.
- [ ] Push payloads are **minimal** — no private notes, ritual responses, locked capsule content, or media paths ([rls-policies §9](rls-policies.md)).
- [ ] No guilt, urgency, FOMO, or "partner is waiting/ignoring" copy.
- [ ] Per-partner pause and per-type preferences honored.
- [ ] Push tokens are user-scoped; partners cannot read each other's tokens.
- [ ] Do not enable production push until delivery orchestration (Phase 12) is implemented and tested.

---

## 11. Mobile QA checklist

- [ ] Core loop: arrive → express (pulse/signal) → reciprocate → remember (timeline) → anticipate (countdown).
- [ ] Onboarding: profile, emotional prefs, quiet hours (per [architecture routes](architecture.md)).
- [ ] Unpaired, single-partner, and fully paired states behave correctly.
- [ ] Loading, empty, and error states use calm copy on all MVP screens.
- [ ] TanStack Query cache invalidation after mutations; no stale cross-couple data after pairing.
- [ ] TanStack Query remains source of truth for server state; Zustand/Jotai stores only light client/UI state.
- [ ] Typecheck/lint pass; no `service_role` or secret keys in `EXPO_PUBLIC_*` env.
- [ ] Offline/transient network: retries where appropriate; permission errors fail clearly (Phase 14 hardening).

---

## 12. Real device testing checklist

- [ ] Test on at least one **physical iOS** and one **physical Android** device (not simulators only).
- [ ] Verify push permission flows when notifications are in scope (Phase 12+).
- [ ] Cross-time-zone pair: sender and recipient in different zones; quiet-hour deferral behaves correctly.
- [ ] Background/foreground: session persists; deep links land on correct routes.
- [ ] Media pick/upload for capsules on real devices (camera roll, permissions).
- [ ] Low connectivity and airplane-mode toggles during critical flows (pairing, send pulse, open capsule).

---

## 13. Supabase production checklist

- [ ] Production project separate from dev/staging; env vars validated via `src/lib/env.ts` pattern.
- [ ] Migrations applied; RLS + Storage policies match [rls-policies.md](rls-policies.md).
- [ ] Helper functions (`is_active_couple_member`, etc.) deployed with `security definer` cautions ([rls-policies §4](rls-policies.md)).
- [ ] RPCs: `create_couple_with_invite`, `accept_couple_invite`, `open_memory_capsule` deployed and permissioned.
- [ ] Indexes from [database.md §6](database.md) present for list/query paths.
- [ ] Generated `database.types.ts` matches production schema.
- [ ] Backups and rollback plan documented (Phase 14/15).
- [ ] Auth redirect URLs and mobile deep links configured for production.

---

## 14. App store readiness placeholder

> Expand in Phase 15 — launch readiness.

- [ ] App name, subtitle, and description reflect **private two-partner** positioning (not dating/social).
- [ ] Privacy nutrition labels / Data safety section accurate (no undisclosed location tracking).
- [ ] Screenshots and preview copy contain **no real couple PII** from production.
- [ ] Age rating appropriate (18+ relationship context).
- [ ] Support URL and privacy policy URL live.
- [ ] Versioning and build numbers aligned with release branch.
- [ ] TestFlight / internal testing track sign-off before production submission.

---

## 15. Known deferred items

Track explicitly so they are not mistaken for launch blockers in early phases:

| Item | Target phase / note |
| --- | --- |
| Full release checklist completion | Phase 14 (reliability/QA) + Phase 15 (launch) |
| Production push + quiet-hour orchestration | Phase 12 — **do not ship push without quiet hours** |
| Realtime subscriptions hardening | Phase 11 |
| Privacy controls (export, delete, leave couple) | Phase 13 |
| Performance, offline resilience, a11y polish | Phase 14 |
| Post-core analytics (PostHog/Sentry, etc.) | Phase 15+ ([architecture §3](architecture.md)) |
| Parallel moments tables/flows | Phase 8 |
| Monetization / subscriptions / RevenueCat | **Not MVP** |
| Exact GPS / live location | **Not MVP** |
| Read receipts / last-seen by default | **Not MVP** |
| Public profiles, discovery, social graph | **Not MVP** |
| AI on private memories | **Not MVP** |
| Relationship end / unpairing data policy | Open — [product-spec open questions](product-spec.md) |
| Invite code hashing (vs raw storage) | Phase 2 consideration — [rls-policies](rls-policies.md) |
| Web client | Default deferred — mobile-first |

---

## Quick non-negotiables (pre-flight)

Before any external release, confirm all of the following are **true**:

- [ ] **No public data exposure**
- [ ] **No broad authenticated reads** on private tables
- [ ] **No exact GPS tracking**
- [ ] **No last-seen / read receipts by default**
- [ ] **No monetization in MVP**
- [ ] **Quiet hours respected** before notifications ship to production users
