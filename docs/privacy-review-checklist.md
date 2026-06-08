# Tara Privacy Review Checklist (Phase 14F)

Complete this checklist before approving any internal distribution build.

## Product-level privacy commitments

- [ ] No public profiles exist in app routes or API behavior.
- [ ] No public discovery, follower graph, or public feed exists.
- [ ] No exact GPS collection, storage, or sharing is implemented.
- [ ] No default last-seen behavior exists.
- [ ] No default read receipts exist.

Operational note: `push_tokens.last_seen_at` is device-token maintenance metadata only. It must not be surfaced as partner-visible presence, read receipts, or ambient activity.

## RLS and data isolation

- [ ] No broad authenticated RLS reads exist on private tables.
- [ ] Couple-scoped tables require active couple membership checks.
- [ ] Outsider account cannot read couple rows through API, not just UI.
- [ ] Service-only tables (for example notification queue internals) are not client-readable.

## Sensitive reveal gates

- [ ] Locked capsule content does not leak before unlock/open.
- [ ] Timeline entries for locked capsules contain metadata only (no private note/media leakage).
- [ ] Unrevealed ritual partner responses remain hidden until reveal conditions are met.
- [ ] Realtime payloads do not reveal hidden ritual/capsule content early.

## Context-aware media access

- [ ] Media access respects couple membership.
- [ ] Media access respects ritual reveal state.
- [ ] Media access respects capsule unlock/open state.
- [ ] Signed URLs are short-lived and fetched only after authorization.

## Notifications and lock-screen safety

- [ ] Notifications contain no private content (notes, ritual responses, capsule contents, media paths).
- [ ] Notification data payload strips sensitive keys/values.
- [ ] Quiet-hours and per-user preference checks are respected in queued delivery logic.

## Logging and monitoring hygiene

- [ ] App logs sanitize sensitive keys (tokens, invite codes, notes, media paths, signed URLs).
- [ ] Sentry events sanitize payloads before send.
- [ ] Sentry user context contains only minimal identity (no private profile payload).
- [ ] No private content is intentionally added to monitoring breadcrumbs/messages.

## Account lifecycle privacy controls

- [ ] Account deletion request flow exists and is user-initiated.
- [ ] Pending account deletion request can be canceled by the same user.
- [ ] Deletion flow revokes push tokens and archives active couple space in server worker path.
- [ ] Data export request flow exists and current limitations are disclosed in UI/docs.

## Secrets and client boundary checks

- [ ] Mobile app uses publishable Supabase key only.
- [ ] `service_role` or admin secrets are not present in mobile runtime env vars.
- [ ] Edge Function secrets are stored in function/CI env, never in app bundle.
