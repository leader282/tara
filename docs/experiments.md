# Tara Experiments and Validation Plan (Phase 15E)

Status: Draft  
Scope: Internal testing and qualitative validation only

## 1. Purpose

This document defines how Tara validates product value after MVP without adding surveillance-style analytics or violating privacy expectations.

It is intended to:

- learn whether Tara reduces emotional distance in real usage,
- validate which post-MVP feature should be built next,
- gather actionable feedback in a privacy-safe way,
- avoid measuring success through engagement pressure.

## 2. Validation principles

1. Prioritize emotional outcomes over usage volume.
2. Use privacy-safe methods first (interviews, structured forms, diary prompts).
3. Do not collect private content when private sentiment is enough.
4. Validate calmness and anxiety reduction as first-class outcomes.
5. Assume lower data collection is better unless justified.
6. Do not introduce analytics SDKs before privacy policy + consent model are ready.
7. A feature is not validated if it increases pressure, guilt, or surveillance feeling.

## 3. What to learn from internal testers

Primary learning goals:

- Does Tara reduce distance-related anxiety?
- Do presence pulses feel meaningful or too lightweight?
- Do rituals feel warm or like homework?
- Do capsules feel emotionally valuable?
- Does the timeline feel like an archive or a feed?
- Are notifications gentle enough?
- Does media feel private?
- Is unpair/delete/export understandable?
- Which post-MVP idea is most desired:
  - comfort kit
  - appreciation jar
  - weekly check-ins
  - silent together mode
  - voice notes
  - shared calendar
  - widgets
  - memory book export
  - AI micro-date planner

## 4. Interview guide

Use 30-45 minute interviews with both partners when possible.

### Opening context

- "What was hardest about feeling connected this week?"
- "When did Tara help most, and when did it not help?"

### Core product questions

- "Do presence pulses feel like a real signal of care or too lightweight?"
- "Did rituals feel supportive, neutral, or like another task?"
- "When you opened timeline, did it feel like a memory archive or a feed you need to keep up with?"
- "Did notifications ever feel disruptive, urgent, or emotionally pressuring?"
- "Did capsules feel emotionally meaningful enough to revisit?"

### Trust and privacy questions

- "Did anything in Tara feel too visible, exposed, or not private enough?"
- "Were unpair/delete/export options easy to find and understand?"
- "Did you ever feel the app was trying to monitor you or your partner?"

### Post-MVP preference ranking

Ask tester to rank top 3 desired next features and explain why:

- comfort kit
- appreciation jar
- weekly check-ins
- silent together mode
- voice notes
- shared calendar
- widgets
- memory book export
- AI micro-date planner

## 5. Diary-study prompts

Use a 7-14 day lightweight diary with one short daily prompt.

Suggested prompts:

1. "Did Tara help you feel closer today? (yes/no + why)"
2. "Did any Tara moment reduce stress or anxiety today?"
3. "Did anything in Tara feel like pressure or obligation?"
4. "Did a notification feel mistimed or too intense?"
5. "Did timeline feel comforting or noisy today?"
6. "Did privacy feel trustworthy today?"
7. "What one thing would make Tara more emotionally helpful tomorrow?"

Weekly wrap prompts:

- "What felt most emotionally valuable this week?"
- "What felt least aligned with a calm/private couples space?"
- "Which next feature would have helped you most this week?"

## 6. Feature concept tests

Run concept-only validation before implementation for post-MVP ideas.

### Test format

- 1-page concept brief per feature (problem, value, boundaries, privacy notes).
- 3-5 concept reactions per tester pair.
- Rank: "most wanted," "uncertain," "not wanted."
- Use synthetic examples only; do not ask testers to provide real capsule notes, ritual responses, photos, voice clips, or other private memories for concept tests.

### Concept test focus by feature

- **Comfort kit:** Does this feel supportive rather than patronizing?
- **Appreciation jar:** Does this feel warm or performative?
- **Weekly check-ins:** Does it reduce misunderstanding without becoming homework?
- **Silent together mode:** Does this feel connected or surveillance-adjacent?
- **Voice notes:** Is emotional value worth privacy/storage complexity?
- **Shared calendar:** Does this help planning without turning Tara into a logistics app?
- **Widgets:** Is glanceability useful enough given lock-screen privacy risk?
- **Memory book export:** Is this emotionally useful and understandable?
- **AI micro-date planner:** Is this wanted at all under strict dual-consent constraints?

## 7. Success signals

Evidence that validation is positive:

- Testers report reduced distance-related anxiety.
- Presence pulses are described as meaningful, not trivial.
- Rituals are described as warm and optional, not burdensome.
- Timeline is described as memory-building, not attention-seeking.
- Notification sentiment is mostly "gentle" and "well-timed."
- Privacy trust remains high across media and account safety flows.
- Clear top 1-2 desired post-MVP features emerge consistently.

## 8. Anti-signals

Signals that should pause or redirect roadmap decisions:

- Users describe Tara as stressful, nagging, or guilt-inducing.
- Features are interpreted as monitoring or status-checking.
- Strong confusion about unpair/delete/export.
- Repeated complaints about notification timing or pressure.
- Users avoid capsules/rituals because they feel emotionally risky.
- No clear demand for a proposed next feature.
- Any reported privacy incident or near-miss.

## 9. Privacy-safe feedback collection

Rules for collecting tester feedback:

- Do not ask testers to share private capsule notes or ritual responses.
- Do not collect screenshots of private content unless explicitly volunteered and redacted.
- Prefer structured feedback forms and interviews over raw content capture.
- Collect only what is needed to answer validation questions.
- Avoid adding analytics until privacy policy and consent are ready.
- If a tester voluntarily shares sensitive details, redact before storing or sharing internally.
- Keep feedback artifacts access-limited to product/research/reliability reviewers.

## 10. Roadmap decision rules

Decision framework after each internal-testing cycle:

1. Confirm no unresolved privacy/security blockers.
2. Review success signals and anti-signals together, not in isolation.
3. Advance only features that:
   - improve closeness,
   - reduce anxiety,
   - preserve calm/private principles.
4. Defer features with unclear value or high trust risk.
5. Re-rank candidate features using validated demand, not novelty.
6. If feedback is mixed, run another focused concept test before implementation.
7. Do not start implementation of a new post-MVP feature until Phase 14 reliability/privacy blockers are resolved.
