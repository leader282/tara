# Tara Architecture (Phase 0)

> Status: Phase 0 architecture baseline. This document defines the technical shape for MVP delivery and establishes what we intentionally defer.

## 1. Architecture goals

- Build a calm, private, mobile-first app for exactly two partners in one couple space.
- Keep implementation simple, explicit, and feature-oriented so Phase 1 to Phase 15 can ship incrementally.
- Enforce privacy and data isolation at the data layer (Supabase RLS), not only in client code.
- Optimize for reliability and emotional safety over feature volume, growth loops, or engagement tricks.
- Keep future expansion (notifications, edge functions, analytics, richer rituals) possible without rewriting the core.

## 2. Product constraints that affect architecture

- Exactly two members per couple space in MVP; every shared feature must be tenant-scoped by `couple_id`.
- No public surfaces: no discovery, social graph, followers, or shareable public feeds.
- No surveillance mechanics in MVP: no live GPS architecture, no exact location tracking, no default read receipts/last-seen model.
- No monetization architecture in MVP: no paywalls, subscriptions, billing services, or entitlement system.
- No full chat system in MVP; interactions stay intentional and lightweight (signals, moments, rituals, capsules, timeline).
- Locked capsule content must remain separate from capsule metadata, with unlock/privacy enforced at the data layer (RLS/RPC), not UI hiding.
- Ritual partner response content must remain hidden until both partners complete the same occurrence, enforced by RLS/RPC.
- Notification delivery must be respectful and time-zone-aware, with recipient quiet-hours control.
- Analytics are deferred until core flows are stable and emotionally safe.

## 3. Frontend architecture overview

Frontend baseline:

- Expo + React Native + TypeScript (strict mode).
- Expo Router for route groups and navigation composition.
- Zod for runtime validation of form input, env parsing, and API boundaries.
- TanStack Query for server state and cache lifecycle.
- Zustand or Jotai only for light client/UI state (never as server-source-of-truth).
- Custom design-token system first (`src/theme/*`).

Deferred/conditional choices:

- React Hook Form: introduced when form complexity justifies it (starting Phase 3+).
- NativeWind: considered later only if token-first styling becomes a bottleneck.
- FlashList: introduced only when list scale/virtualization requires it (timeline/capsules growth).
- Expo Notifications, Sentry, PostHog (or equivalent): added only after core product loop is reliable.

## 4. Recommended route structure using Expo Router

Recommended baseline:

```text
app/
  _layout.tsx
  index.tsx
  +not-found.tsx

  (auth)/
    _layout.tsx
    sign-in.tsx
    sign-up.tsx

  (onboarding)/
    _layout.tsx
    profile.tsx
    emotional.tsx
    quiet-hours.tsx
    complete.tsx

  (invite)/
    _layout.tsx
    create.tsx
    [code].tsx
    accept.tsx

  (couple)/
    _layout.tsx
    index.tsx
    edit-meetup.tsx

    rituals/
      index.tsx
      [ritualId].tsx

    capsules/
      index.tsx
      create.tsx
      [capsuleId].tsx

    timeline/
      index.tsx

    settings/
      index.tsx
      profile.tsx
      notifications.tsx
      privacy.tsx
```

Routing notes:

- `app/_layout.tsx` owns providers (query client, auth/session bootstrap, theme).
- Route groups represent product stages (`(auth)` -> `(onboarding)` -> `(invite)` -> `(couple)`).
- Group-level `_layout.tsx` files centralize guards (session required, pairing required, onboarding completion required).
- Dynamic route params remain narrow and validated (`[code]`, `[ritualId]`, `[capsuleId]`).
- Phase 1 should scaffold the route groups/layout guards only; product feature flows are implemented in their designated later phases.

## 5. Recommended src/ feature-based structure

Recommended baseline:

```text
src/
  components/
    ui/
    shared/

  features/
    auth/
      api/
      components/
      hooks/
      screens/
      schemas.ts
      types.ts

    onboarding/
    profile/
    couple/
    presence/
    rituals/
    capsules/
    timeline/
    countdown/
    notifications/
    settings/

  lib/
    supabase/
      client.ts
      database.types.ts
    query/
      queryClient.ts
    navigation/
    storage/
    dates/
    analytics/
    errors/
    env.ts

  theme/
    tokens.ts
    typography.ts
    spacing.ts

  types/
  utils/
```

Structure rules:

- Each feature owns its domain API, hooks, schemas, and UI composition.
- Shared primitives stay in `components/ui`; cross-feature reusable components in `components/shared`.
- `lib/` is infrastructure-only and feature-agnostic.
- Keep feature boundaries strict: avoid cross-feature imports into internal files when a public feature API can be used.

## 6. Data flow pattern

Canonical pattern:

`screen -> feature hook -> feature api -> Supabase client`

Responsibilities by layer:

- **Screen**: layout, UI events, route params, rendering state from hooks.
- **Feature hook**: orchestrates query/mutation usage, loading/error states, and view-model shaping.
- **Feature api**: isolated Supabase calls and domain-specific mapping; no UI logic.
- **Supabase client**: shared typed client instance in `src/lib/supabase/client.ts`.

Rules:

- Keep screens thin and declarative.
- Never call Supabase directly from screens/components.
- Keep data transforms close to API/hook boundaries.
- Use feature-local query keys and mutation helpers.

## 7. State management strategy

- **Auth/session state**: subscribe once to Supabase auth/session events (app root), expose minimal auth context/selectors.
- **Server state**: TanStack Query is the source of truth for remote data, cache, and invalidation.
- **Client/UI state**: Zustand or Jotai only for ephemeral local state (modal visibility, temporary filters, draft UI state).
- **Hard rule**: do not store Supabase server entities in Zustand/Jotai as canonical state.

Practical examples:

- Query data (rituals, pulses, timeline entries, countdown) lives in TanStack Query.
- UI-only toggles and local wizard step indicators can live in Zustand/Jotai.
- Auth gate decisions come from session listener + minimal derived state.

## 8. Supabase architecture overview

Core backend services:

- Supabase Auth for account identity and session lifecycle.
- Supabase Postgres as the primary relational source of truth.
- Supabase RLS as the primary privacy/isolation enforcement layer.
- Supabase Realtime for low-latency updates where emotional presence benefits.
- Supabase Storage for capsule media and related assets.
- Supabase Edge Functions deferred for privileged/async workflows later.

Data architecture principles:

- Couple-tenant model: all shared domain rows carry `couple_id`.
- Membership is modeled in `couple_members`; do not introduce fixed `partner_a_id` / `partner_b_id` columns.
- RLS enabled on all exposed tables; policies scoped by authenticated membership in the couple.
- App never uses `service_role` keys in client code.
- Migrations are created/applied via Supabase CLI workflow.
- Generated Supabase TypeScript types are adopted once Phase 2 schema is in place.

## 9. Realtime strategy

Phase-oriented approach:

- Start with query-first UX (TanStack Query) and add Realtime only for clearly valuable low-latency events.
- Prioritize Realtime for presence pulses, ritual completions, and selected timeline updates.
- Keep subscriptions scoped by current couple and active screens to control battery/network cost.

Reliability rules:

- Realtime events are a UX accelerator, not the source of truth.
- On reconnect or missed events, re-sync via authoritative queries.
- Prefer idempotent event handling and query invalidation over complex local merge logic.

## 10. Notification-ready architecture

Phase 0/1 design stance:

- Define notification domain concepts early (event type, recipient, quiet-hours, delivery state) even if push is deferred.
- Keep sender intent separate from delivery orchestration.
- Preserve recipient-centric scheduling (recipient timezone and quiet-hours always win).

Future-ready flow:

- Domain event emitted by product action (signal, ritual reminder, invite).
- Delivery orchestration layer (later Edge Functions/worker) resolves timing and channel.
- Client receives push and deep-links into the right Expo Router route.

## 11. Storage strategy

On-device storage:

- Use Expo SecureStore for sensitive local values where secrecy matters.
- Use AsyncStorage for non-sensitive client persistence (light preferences, non-sensitive UI cache).
- Keep sensitive and non-sensitive concerns separated by design.

Cloud storage:

- Use Supabase Storage buckets for media assets (photos/voice for capsules).
- Keep metadata in Postgres (ownership, couple scope, created/open dates).
- Enforce private bucket access through RLS-aware storage policies.
- Keep capsule metadata and locked capsule content split so unlock/privacy rules are data-enforced, not UI-only.

## 12. Environment variable strategy

- Centralize env parsing/validation in `src/lib/env.ts` with Zod.
- Public mobile runtime keys use Expo public env naming (for example `EXPO_PUBLIC_*`).
- Required baseline keys: Supabase URL and Supabase publishable/anon client key.
- Never expose secret keys (`service_role`, private webhooks, admin credentials) in the app bundle.
- Keep per-environment separation (local/staging/prod) and fail fast on invalid/missing vars at startup.

## 13. Error handling strategy

- Create typed domain errors in `src/lib/errors/` and normalize Supabase errors at the API boundary.
- Map low-level errors to user-safe, emotionally calm UI copy.
- Keep retry semantics explicit: transient network failures can retry; permission/policy errors should fail clearly.
- Capture diagnostics in development logs first; production error monitoring (Sentry) is deferred until core stability work.
- Avoid silent failures in mutations; every action must resolve to success feedback or a visible error state.

## 14. TypeScript and code quality rules

- Enable strict TypeScript across the project (`strict: true`) and avoid `any` by default.
- Keep route params, query results, and mutation payloads fully typed.
- Use Zod at runtime boundaries (forms, env, parsed external payloads).
- Prefer small, pure functions in `api/` and `hooks/` over large mixed-responsibility files.
- Keep linting/formatting consistent and block merges on unresolved type errors.
- Co-locate feature types/schemas; reserve global `types/` for truly cross-feature contracts.

## 15. Development workflow

Baseline workflow:

1. Define feature scope and acceptance criteria for current phase.
2. Apply database changes via Supabase CLI migrations (schema + RLS in lockstep).
3. Generate/update Supabase types (from Phase 2 onward) and commit typed client usage.
4. Implement feature API layer, then hooks, then screens/routes.
5. Validate query/mutation behavior, loading/error states, and route guards.
6. Run quality checks (typecheck/lint/tests once configured) before merge.

Delivery principles:

- Keep pull requests phase-scoped and reviewable.
- Prefer additive migrations and forward-only fixes.
- Do not start optional infrastructure (analytics, monetization, advanced notifications) before core loop is healthy.

## 16. Phase boundaries from Phase 1 to Phase 15

- **Phase 1 - App foundation**: Expo/TS setup, router scaffolding, providers, token system baseline, and only minimal shell wiring (no product feature flows yet).
- **Phase 2 - Data foundation**: initial Supabase schema + RLS + generated database types.
- **Phase 3 - Auth and pairing**: sign-up/sign-in, invite create/join, enforce two-partner limit.
- **Phase 4 - Onboarding**: profile + emotional preferences + quiet-hours onboarding flow.
- **Phase 5 - Couple home and countdown**: couple dashboard and reunion countdown CRUD.
- **Phase 6 - Presence signals**: send/receive presence pulses and emotional tone tagging.
- **Phase 7 - Rituals MVP**: preset rituals, completion actions, gentle rhythm (no streak pressure).
- **Phase 8 - Parallel moments MVP**: invite + accept/join flow, timeline event linkage.
- **Phase 9 - Capsules MVP**: capsule creation, media upload path, open-date behavior.
- **Phase 10 - Timeline MVP**: private newest-first timeline aggregation and rendering.
- **Phase 11 - Realtime pass**: selective realtime subscriptions and query re-sync hardening.
- **Phase 12 - Notifications pass**: delivery model, timezone/quiet-hours aware push orchestration.
- **Phase 13 - Privacy controls**: pause/mute, export/delete account data, leave couple flow.
- **Phase 14 - Reliability and quality**: performance tuning, offline/network resilience, accessibility polish.
- **Phase 15 - Launch readiness**: end-to-end QA, release checklist completion, post-core analytics enablement.

## 17. Things not to build yet

- Full chat architecture.
- Live GPS or exact location tracking architecture.
- Monetization/paywall/subscription architecture.
- Analytics instrumentation before core flows are stable.
- Complex Edge Function orchestration before notification and async needs are concrete.
- Premature UI framework additions (NativeWind) unless token-first approach proves insufficient.
- FlashList integration before list scale requires it.
