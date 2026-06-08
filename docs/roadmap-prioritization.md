# Tara Roadmap Prioritization (Phase 15B)

Status: Draft  
Scope: Post-MVP prioritization framework only (no feature implementation)

## 1. Purpose

This document defines how Tara chooses post-MVP work without drifting away from its core promise: a calm, private emotional home for exactly two partners.

It is designed to:

- keep roadmap decisions consistent across product, design, and engineering,
- prioritize closeness and emotional safety over feature volume,
- make tradeoffs explicit using a shared scoring model,
- separate "next to build" from "defer" and "avoid for now."

## 2. Tara product principles after MVP

Post-MVP roadmap decisions must preserve these principles:

1. Two-partner privacy is non-negotiable.
2. Closeness beats engagement metrics.
3. Calm beats novelty.
4. Anxiety reduction beats attention capture.
5. Consent-first interaction beats passive surveillance.
6. Safety defaults beat optional toggles.
7. Data minimization beats feature sprawl.
8. Product depth in core loop beats horizontal expansion.
9. Trust and compliance work is product work, not "backlog leftovers."
10. No roadmap item may violate explicit non-goals:
   - no public profiles,
   - no follower graph,
   - no dating discovery,
   - no exact GPS,
   - no last-seen/read receipts by default,
   - no guilt-based streaks,
   - no AI reading private memories without explicit future consent,
   - no monetization of core safety/privacy,
   - no notifications that increase anxiety.

## 3. Prioritization rubric

Each candidate is scored 1-5 across eight dimensions:

- Emotional closeness impact (benefit)
- Anxiety reduction (benefit)
- Privacy/safety risk (cost)
- Technical complexity (cost)
- Operational burden (cost)
- Reuse of existing architecture (benefit)
- Differentiation (benefit)
- Need for user validation (cost/uncertainty)

Weighted Priority Score (WPS):

`WPS = (2 * closeness) + (1.5 * anxiety) + reuse + differentiation - (2 * privacy_risk) - complexity - operational_burden - (0.5 * validation_need)`

Interpretation:

- Higher WPS = stronger near-term roadmap fit.
- High privacy risk can disqualify even high-closeness ideas.
- High validation need means "test first, do not commit roadmap capacity yet."

## 4. Scoring scale

### Benefit dimensions (closeness, anxiety reduction, reuse, differentiation)

- `1` = negligible benefit
- `2` = low benefit
- `3` = moderate benefit
- `4` = high benefit
- `5` = very high/core-loop benefit

### Cost/risk dimensions (privacy risk, complexity, operational burden, validation need)

- `1` = low risk/cost/uncertainty
- `2` = manageable
- `3` = meaningful
- `4` = high
- `5` = very high; likely defer unless required for safety/compliance

## 5. Candidate feature list

- Comfort kit
- Appreciation jar
- Weekly check-ins
- Silent together mode
- Voice notes
- Shared calendar
- Advanced reunion planner
- Widgets
- Memory book export
- AI micro-date planner
- Better media/gallery experience
- Partner availability windows
- Improved notification intelligence
- Better account deletion/export automation
- Optional monetization exploration

Default ranking anchor from product direction (before rubric scoring):

1. Comfort kit
2. Appreciation jar
3. Weekly check-ins
4. Silent together mode
5. Voice notes
6. Shared calendar / reunion planner
7. Widgets
8. Memory book export
9. AI micro-date planner
10. Monetization exploration (much later)

## 6. Feature scoring table

| Feature | Closeness | Anxiety | Privacy risk | Complexity | Ops burden | Reuse | Differentiation | Validation need | WPS | Priority band |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Comfort kit | 5 | 5 | 2 | 2 | 2 | 5 | 4 | 3 | 17.0 | P1 (next) |
| Appreciation jar | 4 | 4 | 1 | 2 | 1 | 4 | 4 | 2 | 16.0 | P1 (next) |
| Weekly check-ins | 4 | 5 | 2 | 3 | 2 | 4 | 3 | 3 | 12.0 | P1 (next) |
| Silent together mode | 4 | 4 | 2 | 3 | 2 | 3 | 4 | 4 | 10.0 | P1 (next) |
| Better media/gallery experience | 4 | 3 | 3 | 3 | 2 | 4 | 3 | 3 | 7.0 | P2 (near) |
| Partner availability windows | 3 | 4 | 3 | 3 | 2 | 4 | 3 | 4 | 6.0 | P2 (near) |
| Better account deletion/export automation | 2 | 4 | 1 | 4 | 4 | 3 | 2 | 2 | 4.0 | P2 (near, trust) |
| Improved notification intelligence | 3 | 5 | 4 | 4 | 4 | 3 | 3 | 4 | 1.5 | P3 (validate/defer) |
| Memory book export | 3 | 3 | 4 | 3 | 4 | 3 | 3 | 3 | 0.0 | P3 (defer) |
| Voice notes | 4 | 3 | 4 | 4 | 4 | 2 | 2 | 4 | -1.5 | P3 (defer) |
| Advanced reunion planner | 3 | 3 | 3 | 5 | 4 | 2 | 2 | 4 | -2.5 | P3 (defer) |
| Widgets | 2 | 2 | 3 | 4 | 3 | 2 | 2 | 3 | -3.5 | P3 (defer) |
| Shared calendar | 3 | 2 | 3 | 4 | 4 | 2 | 1 | 4 | -4.0 | P3 (defer) |
| AI micro-date planner | 2 | 2 | 5 | 5 | 5 | 1 | 2 | 5 | -12.5 | P4 (avoid now) |
| Optional monetization exploration | 1 | 1 | 5 | 4 | 5 | 1 | 1 | 5 | -16.0 | P4 (avoid now) |

Notes:

- The top four align with the default ranking anchor.
- Voice notes rank lower than the default anchor due to privacy, moderation, and operational overhead.
- Trust/safety automation (deletion/export) is intentionally pulled forward despite lower direct closeness impact.

## 7. Recommended next features

### Next roadmap wave (post-MVP immediate)

1. Comfort kit
2. Appreciation jar
3. Weekly check-ins
4. Silent together mode

Why: highest combined closeness and anxiety-reduction with low-to-moderate risk and strong architecture reuse.

### Near-term enablers (run in parallel or immediately after)

5. Better media/gallery experience
6. Better account deletion/export automation
7. Partner availability windows (strictly optional and consent-based)

Why: these improve quality/trust and support future feature depth without violating calm/private principles.

## 8. Features to defer

Defer until higher-confidence user validation and/or stronger privacy/ops readiness:

- Voice notes
- Shared calendar
- Advanced reunion planner
- Widgets
- Memory book export
- Improved notification intelligence (beyond simple recipient-safe rules)

Defer criteria:

- privacy model ambiguity,
- increased anxiety risk,
- significant platform and operational overhead,
- uncertain value relative to core emotional loop.

## 9. Features to avoid for now

Do not roadmap now:

- AI micro-date planner
- Optional monetization exploration
- Any extension that behaves like social/discovery/chat infrastructure
- Any "smart notification" behavior that infers or surfaces partner availability in anxiety-inducing ways

Reason:

- weakest fit to current product promise,
- highest privacy/safety risk,
- high complexity burden,
- direct conflict with current product constraints.

## 10. Research questions

Before promoting deferred items, answer:

1. Which top-four additions most increase felt closeness without increasing pressure?
2. Do users perceive partner availability windows as reassuring or monitoring-adjacent?
3. What minimal media/gallery improvements unlock most emotional value?
4. What exact export format users actually need first (timeline snapshots, capsules, media index)?
5. For voice notes, what privacy/storage/retention model would be acceptable?
6. Which notification improvements reduce anxiety measurably without behavioral nudging?
7. What post-unpair/deletion expectations do users have for shared memories?
8. Which roadmap additions are still useful if one partner engages less frequently?

## 11. Decision log

| Date | Decision | Rationale | Revisit trigger |
| --- | --- | --- | --- |
| 2026-06-09 | Adopt weighted rubric with explicit risk penalties | Prevents emotional-impact-only decisions from bypassing privacy/safety costs | If risk incidents rise or scoring fails to predict delivery value |
| 2026-06-09 | Confirm top-four feature sequence: Comfort kit, Appreciation jar, Weekly check-ins, Silent together mode | Best fit to calm, private, low-pressure emotional loop | If user research shows pressure/anxiety side effects |
| 2026-06-09 | Pull trust automation (deletion/export) into near-term enabler set | Compliance/trust debt should not be deferred behind novelty | If automation is complete and validated in production-like environment |
| 2026-06-09 | Defer voice notes and calendar/planner expansions | Current privacy/ops burden outweighs near-term value | If storage/privacy model and user demand are validated |
| 2026-06-09 | Keep AI planner and monetization exploration out of near-term roadmap | Misaligned with product constraints and safety posture | Only after explicit strategy reset and consent model design |
