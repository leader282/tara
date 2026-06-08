# Tara Post-MVP Roadmap (Phase 15C)

Status: Draft  
Scope: Planning only (no implementation work)

## 1. Roadmap overview

This roadmap proposes a practical post-MVP sequence that preserves Tara's identity: a calm, private emotional home for exactly two partners.

Guiding approach:

- deepen core emotional loop before broad expansion,
- prioritize low-anxiety, high-closeness features first,
- run trust/privacy hardening in parallel with feature phases,
- treat later phases (AI and monetization) as conditional research tracks, not commitments.

## 2. Recommended next phase: Phase 16 Comfort Kit

- **Goal:** Add low-pressure, emotionally supportive quick actions for moments of distance or overwhelm.
- **User value:** Helps partners reconnect gently in seconds without requiring long conversations.
- **Rough technical scope:** New comfort-kit surface, curated action templates, optional timeline entry, optional gentle partner nudge.
- **Database impact:** Prefer minimal/no new tables initially; reuse existing event/timeline patterns where possible.
- **RLS/privacy impact:** Couple-only visibility; no surveillance cues; no anxiety-inducing notification phrasing.
- **Dependencies:** Notification safety copy patterns, route consistency, and no unresolved S0 privacy/security debt from Phase 15C.
- **Risks:** Can feel prescriptive if copy is too rigid; notification misuse could create pressure.
- **Success criteria:** Healthy usage from both partners, no rise in notification complaints, positive qualitative closeness feedback.

## 3. Phase 17 Appreciation Jar

- **Goal:** Enable lightweight gratitude moments that accumulate over time.
- **User value:** Reinforces emotional continuity and positive memory-building.
- **Rough technical scope:** Create/list appreciation notes, optional timeline surfacing, simple entry management.
- **Database impact:** Likely add a small couple-scoped appreciation entries model.
- **RLS/privacy impact:** Strict couple scoping; no public export/share by default.
- **Dependencies:** Comfort Kit interaction learnings, timeline integration patterns.
- **Risks:** Could become performative if over-structured.
- **Success criteria:** Repeat voluntary use without pressure signals, stable privacy behavior.

## 4. Phase 18 Weekly Check-ins

- **Goal:** Introduce gentle weekly emotional sync rituals.
- **User value:** Builds attunement and reduces misalignment across busy or timezone-split weeks.
- **Rough technical scope:** Weekly prompts, optional private response, partner reveal rules.
- **Database impact:** Prefer extending ritual workflows over building a parallel system.
- **RLS/privacy impact:** Preserve reveal gating model; no guilt loops or streak pressure.
- **Dependencies:** Ritual reliability and reveal semantics already in place.
- **Risks:** Users may perceive check-ins as obligation if framing is wrong.
- **Success criteria:** Sustained opt-in completion with low skip-anxiety feedback.

## 5. Phase 19 Silent Together Mode

- **Goal:** Offer explicit, consent-based "quiet co-presence" sessions.
- **User value:** Creates togetherness without conversation burden.
- **Rough technical scope:** Start/end session controls, lightweight session state, optional gentle acknowledgments.
- **Database impact:** Small session model likely needed for session state/history.
- **RLS/privacy impact:** Must avoid last-seen surveillance behavior; explicit opt-in and reversible state only.
- **Dependencies:** Strong route guarding, notification restraint, timezone handling.
- **Risks:** Could drift into ambient monitoring if visibility scope expands.
- **Success criteria:** Usage indicates comfort and closeness, not pressure or checking behavior.

## 6. Phase 20 Voice Notes

- **Goal:** Evaluate asynchronous voice-based emotional expression.
- **User value:** Adds richer emotional texture than text-only interactions.
- **Rough technical scope:** Record/upload/playback UI, media handling, optional timeline integration.
- **Database impact:** Likely extend media metadata and add a voice-note linkage model.
- **RLS/privacy impact:** Strict media access controls; lock-screen-safe notifications; retention policy clarity required.
- **Dependencies:** Media cleanup workflow, signed URL behavior, operational readiness.
- **Risks:** Storage cost, privacy sensitivity, moderation/abuse edge cases.
- **Success criteria:** Strong user value with no privacy incidents and manageable operational cost.

## 7. Phase 21 Shared Calendar and Reunion Planner

- **Goal:** Support planning shared future moments with minimal logistics burden.
- **User value:** Reduces coordination stress and increases reunion anticipation.
- **Rough technical scope:** Simple shared milestones/plans, optional reminders, reunion planning checklist.
- **Database impact:** New couple-scoped planning entities likely required.
- **RLS/privacy impact:** Couple-only data, no external sharing by default, no anxiety-driven reminder behavior.
- **Dependencies:** Date/time helper consistency, notification restraint, scope discipline.
- **Risks:** Scope creep toward generic productivity tool.
- **Success criteria:** Increased reunion planning completion without elevated cognitive load.

## 8. Phase 22 Widgets

- **Goal:** Add glanceable low-friction touchpoints on home/lock screens.
- **User value:** Lightweight presence and countdown visibility.
- **Rough technical scope:** iOS/Android widget surfaces, widget-safe state sync, privacy modes.
- **Database impact:** Minimal direct schema impact expected.
- **RLS/privacy impact:** High lock-screen sensitivity; require redaction options and safe defaults.
- **Dependencies:** Stable API payloads, signed URL/secret handling boundaries.
- **Risks:** Sensitive data exposure on shared or visible devices.
- **Success criteria:** Widget usage without increased privacy concerns.

## 9. Phase 23 Memory Book Export

- **Goal:** Offer a meaningful couple-private memory export artifact.
- **User value:** Long-term emotional value and stronger trust in data portability.
- **Rough technical scope:** Export composition pipeline, downloadable package generation, request tracking UX.
- **Database impact:** Extend existing export request model and/or add export job metadata.
- **RLS/privacy impact:** Strict authorization checks, short-lived secure download links, retention/deletion policy.
- **Dependencies:** Account deletion/export automation hardening and operational runbooks.
- **Risks:** Data leakage if export links or generation flow are mishandled.
- **Success criteria:** Reliable export completion and low support friction.

## 10. Phase 24 AI Micro-date Planner

- **Goal:** Explore optional AI-assisted planning suggestions.
- **User value:** Potential planning convenience for some couples.
- **Rough technical scope:** Suggestion generation flow and opt-in controls.
- **Database impact:** Consent and feature-flag metadata likely required before any rollout.
- **RLS/privacy impact:** Must be explicit-consent, reversible, and auditable; no AI reading private memories by default.
- **Dependencies:** Mature trust posture, legal/policy review, explicit consent architecture.
- **Risks:** Trust erosion, privacy concerns, product-principle drift.
- **Success criteria:** Limited opt-in pilot with zero privacy incidents and clear user trust.

## 11. Phase 25 Monetization Exploration

- **Goal:** Evaluate sustainable business options without compromising core principles.
- **User value:** Indirect (supports long-term product viability).
- **Rough technical scope:** Research and pricing experiments only; no near-term paywall implementation commitment.
- **Database impact:** None required for initial exploration.
- **RLS/privacy impact:** Monetization cannot gate core safety/privacy controls.
- **Dependencies:** Strong retention, trust baseline, clear ethical constraints.
- **Risks:** Product trust damage if introduced too early or misaligned.
- **Success criteria:** Decision memo that preserves calm/private principles; no implementation unless explicitly approved later.

## 12. Dependencies and sequencing

Recommended sequence:

1. **Phase 16:** Comfort Kit (next implementation phase)
2. **Phase 17:** Appreciation Jar
3. **Phase 18:** Weekly Check-ins
4. **Phase 19:** Silent Together Mode

Parallel enabling lane (before/during 16-19):

- deletion/export safety hardening,
- worker scheduling/runbooks,
- RLS test expansion,
- signed URL and media lifecycle reliability.

Deferred lane (validation-gated):

- Voice Notes, Shared Calendar/Reunion Planner, Widgets, Memory Book Export.

Long-horizon conditional lane:

- AI Micro-date Planner and Monetization Exploration (consent-dependent and strategy-dependent).

## 13. Security/privacy prerequisites

Before each new phase enters implementation:

1. No unresolved S0 privacy/security debt.
2. Sensitive RLS tests pass for affected data paths.
3. Notification and logging payloads remain privacy-safe.
4. Signed URL and media access behavior are validated for new surfaces.
5. Any new sensitive capability has explicit opt-in and clear reversal path.
6. Account safety flows remain reliable and understandable.

Additional prerequisites for Phase 24+:

- explicit consent model finalized,
- policy/legal review complete,
- no implicit AI access to private couple memories.

## 14. What not to build yet

Do not build as part of this roadmap unless principles are formally revised:

- public profiles,
- follower graph or social feed,
- dating/discovery surfaces,
- exact GPS tracking,
- default last-seen/read receipts,
- guilt-based streak mechanics,
- AI reading private memories without explicit future consent,
- monetization that gates core privacy/safety,
- notifications designed to induce anxiety or urgency.

## 15. How roadmap decisions should be revisited after internal testing

Revisit process:

1. Run internal testing cycles for each completed phase.
2. Capture qualitative signals: closeness, calmness, pressure, privacy confidence.
3. Compare against safety metrics: privacy incidents, notification complaints, account safety failures.
4. Re-score roadmap candidates using `docs/roadmap-prioritization.md`.
5. Decide to proceed, pause, or defer next phase based on evidence, not momentum.

Revisit triggers:

- rise in anxiety-related feedback,
- any privacy/security regression,
- operational instability in workers or account-safety flows,
- mismatch between expected and observed user value.
