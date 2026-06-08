# Tara Privacy & Security Roadmap (Phase 15D)

Status: Draft  
Scope: Planning and governance only (no implementation)

## 1. Purpose

This roadmap defines how Tara protects privacy and emotional safety as post-MVP features are explored.  
It exists to prevent product expansion from weakening the trust model established in MVP.

Objectives:

- preserve two-partner data isolation as a hard invariant,
- require data-layer enforcement (RLS/RPC/storage) for all sensitive behavior,
- set explicit security review gates before each future phase,
- keep later AI/monetization exploration consent-dependent and safety-bound.

## 2. Tara privacy principles

1. Privacy is a core product behavior, not an optional setting.
2. Couple isolation is enforced at the data layer, never UI-only.
3. No public profiles, public feeds, discovery, or follower graph.
4. No exact GPS collection or sharing unless a future design is explicit, justified, consent-based, and separately approved.
5. No online status/last-seen model.
6. No read receipts by default.
7. No guilt-based notifications or pressure mechanics.
8. No AI access to private memories/signals without explicit consent from both partners.
9. Quiet hours and deletion/export safety controls are non-monetizable.
10. Default settings must be the safer option.

## 3. Current MVP privacy model

Current model (based on product/privacy docs and migration context):

- Couple-scoped data model with two-partner boundary.
- RLS enabled on private application tables; service-only worker tables are not client-readable.
- Security-definer RPC workflows used for sensitive transitions (invite acceptance, ritual/capsule flows, account safety operations).
- Locked capsule and ritual reveal behavior are intended to be data-enforced, not presentation-enforced.
- Private storage model with couple-scoped access checks and short-lived signed URL expectation.
- Notification pipeline uses queue/delivery tracking with recipient-preference and quiet-hours intent.
- Account deletion and export requests exist as server-managed safety workflows, with operational hardening still tracked as debt.

## 4. Future privacy risks

Primary risks as roadmap expands:

1. **Scope drift into surveillance semantics** (availability, silent presence, widgets).
2. **Lock-screen leakage** from notifications/widgets.
3. **Media expansion risk** (voice notes and richer gallery) without context-aware access checks.
4. **Export leakage risk** if authz/audit/TTL are weak.
5. **RLS drift risk** as new tables and policies are added.
6. **Operational risk** from background workers without clear monitoring/runbooks.
7. **Consent ambiguity risk** in AI-assisted features.
8. **Trust risk** if monetization touches safety/privacy controls.

## 5. Feature-by-feature privacy review

| Feature | Risk level | Primary privacy/security risks | Required controls before implementation |
| --- | --- | --- | --- |
| Comfort kit | Medium | accidental partner-pressure notifications; private text leakage | generic lock-screen-safe copy; couple-scoped events; no read/seen states |
| Appreciation jar | Medium | private gratitude content leakage; overexposure in timeline/widgets | strict couple RLS; opt-in surfacing; safe summaries only |
| Weekly check-ins | Medium | ritual response leakage before intended reveal | explicit reveal gate enforcement; no streak pressure metadata |
| Silent together mode | High | drift into ambient monitoring or "who is online" semantics | explicit mutual opt-in; reversible sessions; no passive status history |
| Voice notes | High | sensitive media leakage; retention and replay exposure | context-aware storage policies; short TTL signed URLs; explicit retention rules |
| Shared calendar | Medium-High | expanded personal scheduling data sensitivity | strict couple-only RLS; minimal data collection; non-anxious reminder defaults |
| Advanced reunion planner | Medium-High | over-collection of travel/location-like metadata | coarse labels only; no exact GPS; data minimization checks |
| Widgets | High | lock-screen/home-screen exposure of sensitive content | default redacted mode; no private text/images/responses shown |
| Memory book export | High | high-volume sensitive data exfiltration risk | authenticated request; authorization checks; audit trail; short-lived signed files |
| AI micro-date planner | Critical | hidden inference on private memories; consent ambiguity | explicit dual-partner consent; strict data boundary; auditable opt-in/out |
| Monetization exploration | Critical | erosion of safety controls via pricing pressure | explicit ban on monetizing safety/privacy/deletion/quiet-hours controls |

## 6. RLS requirements for future features

Required RLS standards for all future phases:

1. Every new couple-scoped table must include explicit couple membership checks.
2. No broad authenticated read/write policies on private tables.
3. Sensitive transitions must use server-validated RPC/transaction workflows.
4. Reveal-gated content must use row-level gating or isolated table shapes; never rely on hidden columns alone.
5. New `UPDATE`/`DELETE` paths must define ownership and lifecycle constraints explicitly.
6. Outsider-access negative tests are mandatory for each new model.
7. Any policy involving self-referential checks should use carefully reviewed helper predicates to avoid recursion bugs.
8. Service-only workflow tables should remain non-readable by standard client roles.

## 7. Storage requirements for future features

1. Storage buckets must remain private by default.
2. No media read access without validating:
   - active couple membership, and
   - contextual reveal state (ritual/capsule/session constraints where applicable).
3. Signed URLs must be short-lived and revalidated on refresh.
4. Upload failure/orphan cleanup must be defined before scaling media-heavy features.
5. Object path design must avoid leaking private meaning.
6. Voice/media retention policy must be explicit before voice notes or richer media phases.
7. Metadata and storage access rules must remain aligned (no metadata says "blocked" while storage still serves object).

## 8. Notification requirements for future features

1. Notification payloads must remain content-minimized and lock-screen-safe.
2. Never include private notes, ritual responses, capsule notes, voice content, or media links in push text/data.
3. Recipient quiet-hours and user preferences always override sender intent.
4. No notification copy that implies blame, urgency, or response debt.
5. Notification intelligence enhancements must not infer/surface partner surveillance signals.
6. New notification types require abuse review and copy review before release.

## 9. AI consent requirements

AI features are out of near-term scope and require explicit security/privacy review before any build:

1. AI access to private couple content requires explicit consent from both partners.
2. Consent must be:
   - informed,
   - granular (feature-specific),
   - reversible,
   - auditable.
3. No silent background ingestion of memories, timeline entries, ritual responses, or media.
4. Consent withdrawal must stop new processing and define existing data handling clearly.
5. AI rollout must begin as a limited opt-in safety pilot with documented incident response.
6. Consent records, prompts, outputs, and audit records must be couple-scoped with RLS; no private memory/media copies may be stored for AI without explicit retention rules.

## 10. Export/deletion requirements

Export requirements:

- authenticated request by current user,
- strict authorization to own/allowed data,
- server-side generation flow,
- auditable request lifecycle,
- short-lived signed download URLs,
- clear expiration/retention handling.

Deletion requirements:

- user-initiated and reversible pending window where applicable,
- verified identity/session checks for destructive operations,
- coupled revocation of push/session artifacts,
- clear handling of shared couple data transitions,
- post-deletion verification and auditability.

No export/deletion behavior should rely on client-only logic.

## 11. Widget/lock-screen safety

Widget and lock-screen surfaces are high-risk and must default to privacy-safe presentation:

1. Do not render private text, images, capsule notes, ritual responses, or media previews on widgets/lock screen.
2. Use generic safe placeholders unless user explicitly opts into low-sensitivity display modes.
3. Never expose partner activity semantics (online now, last seen, read state).
4. Ensure deep-link actions still pass normal in-app authz checks.
5. Include "shared-device visibility" risk review before launch.

## 12. Abuse/safety considerations

Future roadmap must account for misuse scenarios without turning Tara into surveillance software:

- invite misuse and brute force mitigation,
- coercive partner dynamics around availability/presence features,
- harassment via repeated nudges/notifications,
- misuse of export as coercive control vector,
- device theft and token/session revocation response,
- graceful and safe unpairing/account exit flows.

Safety posture:

- protect user autonomy,
- preserve reversibility,
- avoid features that let one partner monitor the other.

## 13. Security review gates

### Phase-start mandatory checklist

Before any future phase starts, confirm:

- [ ] data model
- [ ] RLS model
- [ ] storage model
- [ ] notification copy
- [ ] deletion/export impact
- [ ] logging/Sentry redaction
- [ ] route guards
- [ ] test plan

### Review gates by milestone

1. **Design gate:** privacy threat review and misuse-case review complete.
2. **Schema gate:** table/function/storage changes reviewed for least-privilege behavior.
3. **Policy gate:** RLS/storage policies and negative outsider tests drafted.
4. **Copy gate:** notification and lock-screen copy reviewed for anxiety/privacy leakage.
5. **Pre-release gate:** checklist pass, test evidence pass, no unresolved S0 privacy debt.

## 14. Do-not-build-without-review list

The following items require explicit security/privacy review before implementation starts:

1. Silent Together Mode (presence-like semantics).
2. Voice Notes and any new media type.
3. Shared Calendar and Advanced Reunion Planner (expanded personal scheduling data).
4. Widgets and any lock-screen surfaces.
5. Memory Book Export generation/download flow.
6. AI Micro-date Planner or any AI-assisted feature.
7. Any monetization mechanism touching user controls.
8. Any feature proposing:
   - exact GPS or location history,
   - read receipts or last-seen defaults,
   - partner-activity inference notifications.
