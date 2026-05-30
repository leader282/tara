# Tara — Product Spec (Phase 0)

> Status: Phase 0 product definition. This document defines **what** we are building and **why**, in enough detail to drive schema, RLS, and client work. It intentionally avoids monetization, complex AI, and any feature beyond a focused MVP. Architecture, schema, and policies are defined in their own docs (`architecture.md`, `database.md`, `rls-policies.md`).

---

## 1. Product vision

Tara is a **private emotional home for exactly two partners** who are physically apart.

Most apps a couple already uses are loud, public, or transactional: social feeds optimize for an audience, chat apps optimize for volume, and "tracking" apps optimize for surveillance. None of them are built for the specific, tender job of *feeling close to one person you love while you are far away from them*.

Tara is the opposite of loud. It is a small, calm space that holds the rhythm of one relationship: the good-mornings across time zones, the "thinking of you" in the middle of a workday, the countdown to the next time you are in the same room, and the memories you are saving for when you are. The product succeeds when distance feels smaller and the bond feels secure — not when usage time goes up.

Everything in Tara is built around one couple. There is no audience, no discovery, no growth loop that pulls in strangers. Two people, one shared space, fully private.

---

## 2. One-sentence description

Tara is a private long-distance couples app for exactly two partners that helps them feel emotionally close — through presence pulses, rituals, parallel moments, memory capsules, a shared timeline, reunion countdowns, and gentle time-zone-aware notifications.

---

## 3. Core product promise

> **"Tara helps long-distance couples feel together even when they are apart."**

Every feature, copy decision, and notification must be defensible against this promise. If something does not help two partners feel closer, calmer, or more secure, it does not belong in Tara.

---

## 4. Target users

Tara is for **committed couples who are temporarily or recurrently physically separated** and who want a private, low-pressure way to stay emotionally connected.

Primary users:

- Long-distance couples separated by work, study, military service, immigration/visa timelines, family obligations, or travel.
- Couples across different cities, countries, or time zones.
- Adults (18+) in an existing, consensual romantic relationship who both choose to use the app.

User characteristics we design for:

- **Two people who already trust each other.** Tara is not for finding a partner; it is for nurturing an existing relationship.
- **Asynchronous lives.** They are often awake at different times and cannot always reply immediately.
- **Mainstream phone users.** We assume normal smartphone literacy, not power users.
- **Emotionally invested but time-poor.** Interactions must be meaningful in seconds, not minutes.

Non-users (explicitly out of scope): singles seeking matches, groups/polycules larger than two in MVP, friends/family circles, and anyone wanting a public presence.

---

## 5. Emotional job to be done

When framed as jobs-to-be-done, users "hire" Tara for emotional outcomes, not features:

- **Primary JTBD:** *"When my partner and I are apart and I start to feel distant or out of sync, I want a simple, private way to reach them and feel reached, so that the distance feels smaller and I feel secure in us."*

Supporting jobs:

- *"When I think of them during my day, I want to send something that says 'you're on my mind' without starting a whole conversation I don't have time for."*
- *"When we can't be in the same place, I want us to still share an experience at the same time so it feels like we did something together."*
- *"When I'm counting down to seeing them, I want to feel the anticipation together instead of alone."*
- *"When something sweet happens, I want to keep it somewhere private and ours, not on a public feed."*
- *"When we're in different time zones, I want to reach them without waking them or feeling ignored when they're asleep."*

The emotional outcomes Tara optimizes for: **closeness, reassurance, anticipation, attunement, and continuity.** The feelings Tara actively avoids creating: guilt, surveillance anxiety, performance pressure, and obligation.

---

## 6. MVP emotional loop

The core loop is intentionally short and low-effort. A satisfying interaction should take **seconds**, and the loop should feel rewarding without being addictive or guilt-driven.

1. **Arrive** — A partner opens Tara and sees their shared space: the other's most recent presence/love signal, the reunion countdown, and a calm private timeline of recent moments.
2. **Express** — With one or two taps they send a **presence pulse** or **love signal**, optionally tagged with an **emotional tone** (e.g., "thinking of you," "missing you," "goodnight").
3. **Reach gently** — The partner receives a warm, **time-zone-aware** notification that respects their **quiet hours**. If they are asleep, it waits.
4. **Reciprocate / share** — The partner responds with their own signal, joins a **parallel moment** invite, completes a shared **ritual**, or adds to a **memory capsule**.
5. **Remember** — Meaningful exchanges and moments are quietly saved to the shared **timeline**, building a private history the couple can revisit.
6. **Anticipate** — The **reunion countdown** ticks down in the background, turning waiting into shared anticipation.
7. **Return** — Because the loop felt warm and pressure-free (not nagging), they come back tomorrow.

Design constraint: the loop must remain satisfying even if only **one** partner acts in a given day. Tara never punishes a missed day.

---

## 7. MVP scope

The MVP delivers the full emotional loop with the **simplest possible version** of each feature. We ship a focused, polished core rather than many shallow features.

**In scope for MVP:**

1. **Account & pairing** — Sign up/sign in; create or join exactly one **couple space**; invite the single second partner via a secure invite; enforce the two-person limit.
2. **Couple space** — The private container that owns all couple data; both partners are equal members.
3. **Presence pulses & love signals** — Send a small, intentional signal ("thinking of you," "miss you," "goodnight," etc.), optionally with an emotional tone.
4. **Reunion countdown** — Set and view a countdown to the next time the partners will be physically together.
5. **Rituals (basic)** — A small set of recurring, opt-in shared check-ins (e.g., good morning / goodnight, a daily prompt). No guilt streaks.
6. **Parallel moments (basic)** — Invite the partner to do something at the same time ("watch the sunset," "coffee now," "this song"); partner can accept/join.
7. **Memory capsules (basic)** — Save photos/notes/voice into a private keepsake; optional simple scheduled open date.
8. **Private timeline** — A reverse-chronological (newest-first), partner-only feed of pulses, moments, completed rituals, and capsule entries.
9. **Emotional tone tagging** — Lightweight, optional mood tag attached to signals and timeline entries.
10. **Quiet hours & notifications** — Per-partner, time-zone-aware notification delivery that honors quiet hours.
11. **Privacy controls** — Pause/mute, leave couple space, export, and delete account/data.

**Deliberately kept minimal in MVP** (full versions deferred — see roadmap):

- Rituals support only a few preset types; no custom ritual builder.
- Parallel moments are invite + join only; no live sync, video, or in-app media playback.
- Memory capsules support a simple open date; no rich "vault," themes, or AI organization.
- Emotional tone is a small fixed set; no mood history analytics.
- One couple space per user.

---

## 8. Explicit non-goals

These are hard boundaries for MVP and the current roadmap direction. Anything outside them requires an explicit future product decision rather than scope creep.

- **Not a dating app.** No matching, no discovery of new people.
- **Not a social network.** No public profiles, no followers, no audience, no feed of strangers.
- **Not a generic chat app.** Tara is not trying to replace messaging; expression is intentional and lightweight, not high-volume.
- **Not a surveillance app.** No exact GPS tracking in MVP, no covert monitoring, no "checking up on" mechanics.
- **No public profiles.**
- **No followers or social graph.**
- **No dating/discovery surfaces.**
- **No exact GPS / live location tracking in MVP.**
- **No "last seen" by default.** Presence is intentional and opt-in, never ambient surveillance.
- **No read receipts by default.**
- **No guilt-based streaks.** Rituals encourage rhythm, never punish a missed day.
- **No monetization in MVP.** No subscriptions, no RevenueCat, no paywalls, no in-app purchases.
- **No AI reading private memories in MVP.** Capsules, timeline, and signals are not analyzed by AI.

When a feature request conflicts with this list, the list wins.

---

## 9. Product tone

Tara should feel like a **calm, warm room built for two**. The voice and visual tone are consistent across UI copy, notifications, empty states, and errors.

Principles → how they show up:

- **Warm** — Language is affectionate and human, never corporate. ("Sent with love" not "Message delivered.")
- **Calm** — Generous whitespace, soft motion, no badges screaming for attention, no infinite scroll.
- **Private** — The UI constantly, quietly reassures that this space is just for the two of them.
- **Emotionally safe** — Never induce guilt, jealousy, or anxiety. No "your partner hasn't replied" shaming.
- **Modern & premium** — Clean, refined, considered. Feels like a quality product, not a gimmick.
- **Romantic without being cheesy** — Sincere over saccharine. Avoid clichés, excessive hearts, and pet-name presumptions.
- **Supportive without being therapeutic** — We hold space for feelings; we do not diagnose, counsel, or use clinical language.
- **Playful when appropriate** — Light delight in the right moments (a sweet animation when a pulse lands), never silly in tender ones.

Copy do/don't:

- Do: "It's late for them right now — we'll deliver this when they wake up."
- Don't: "Your partner is ignoring you."
- Do: "You're 12 days from being together."
- Don't: "Only YOU sent a pulse today. Don't break your streak!"

---

## 10. Domain language glossary

These terms are the shared vocabulary for product, design, and engineering. They map directly to entities and behaviors used throughout the codebase.

| Term | Definition |
| --- | --- |
| **Couple space** | The single private container that belongs to exactly two partners. It owns all of the couple's data (pulses, rituals, moments, capsules, timeline, countdown). It is the root tenant for isolation and the boundary that all privacy/RLS rules enforce. A couple space never has more than two members. |
| **Partner** | One of the two members of a couple space — an authenticated user who belongs to one couple space (in MVP). The two partners are equals; there is no owner/admin hierarchy over shared content. |
| **Presence pulse** | A lightweight, **intentional** signal a partner deliberately sends to say "I'm here / I'm thinking of you," without requiring a conversation. It is opt-in and sent on purpose — never automatic location or "last seen." A pulse may carry an emotional tone. |
| **Ritual** | A recurring, opt-in shared activity the couple agrees to do (e.g., good morning / goodnight, a daily prompt, weekly highlight). Rituals create gentle rhythm and are explicitly **not** guilt-based — missing one has no penalty. |
| **Parallel moment** | A shared experience done **at the same time despite the distance** ("let's both watch the sunset," "coffee together now," "listen to this"). One partner invites, the other can join, creating synchronized togetherness. |
| **Memory capsule** | A private keepsake bundling memories (photos, notes, voice) that the couple saves and can optionally **time-lock** to open on a future date (e.g., an anniversary or reunion). Capsules are private to the couple and not analyzed by AI in MVP. |
| **Timeline** | The couple's private history — pulses, moments, completed rituals, capsule entries, and milestones — usually displayed newest-first. Visible **only** to the two partners. It is the couple's shared memory, not a public feed. |
| **Reunion countdown** | A countdown to the next time the partners will be physically together. Has a target date and an optional label; turns waiting into shared anticipation. |
| **Quiet hours** | Per-partner, time-zone-aware windows during which notifications are silenced or deferred (e.g., sleep hours). Tara honors each partner's quiet hours so reaching out never becomes intrusion. |
| **Love signals** | The curated set of small, predefined affectionate gestures partners can exchange — presence pulses, reactions, and short affirmations. It is the warm "language of small gestures" that keeps expression effortless and pressure-free (a presence pulse is one kind of love signal). |
| **Emotional tone** | A small, optional descriptor a partner can attach to a signal or timeline entry to convey how they feel (e.g., happy, missing you, tired, excited, low). Lightweight attunement — not a mood tracker, not therapeutic, not AI-analyzed in MVP. |

---

## 11. MVP feature descriptions

Each feature is described in product terms with the behavior an engineer can build from. Schema lives in `database.md`; access rules live in `rls-policies.md`.

### 11.1 Account & pairing
- A user signs up and either **creates** a couple space or **joins** an existing one via a secure, single-use invite.
- A couple space accepts **exactly two** partners. Once two have joined, further joins are rejected.
- Pairing is the gateway to all other features; an unpaired user sees a calm "invite your partner" state and nothing else.
- Implementation notes: invite is a time-limited, single-use token; enforce the two-member cap at the data layer, not just the UI.

### 11.2 Couple space
- The private home that owns all shared content; both partners have equal access to shared items.
- Everything created in Tara is scoped to one couple space. Nothing is global or public.

### 11.3 Presence pulses & love signals
- One-to-two-tap sending of a small gesture from a fixed set (e.g., "thinking of you," "miss you," "goodnight," "good morning," a heartbeat/tap).
- Optional **emotional tone** attached.
- Sending is intentional; there is no automatic/ambient presence broadcast.
- The most recent received signal is surfaced on the home screen; all signals also land on the timeline.

### 11.4 Reunion countdown
- Either partner sets a target date (and optional label, e.g., "Tara flies to Lisbon").
- Both partners see the same countdown prominently.
- When the date arrives, Tara celebrates gently and prompts setting the next one (no pressure if there isn't one).

### 11.5 Rituals (basic)
- A small set of preset, opt-in rituals the couple can enable (e.g., good morning / goodnight, daily prompt).
- Completing a ritual is a light action that appears on the timeline.
- If a ritual includes a response, each partner sees their own response immediately; the partner response stays hidden until both partners complete the same occurrence.
- **No streak counters, no penalties, no "you broke it" messaging.** A gentle nudge at most, always skippable.

### 11.6 Parallel moments (basic)
- A partner sends an invite to do something together now ("watch the sunset," "coffee," "this song").
- The other partner can accept/join; a joined moment is recorded to the timeline as something they did together.
- MVP is now-invite + acknowledge only — no scheduled invites, live streaming, calls, or synchronized media playback.

### 11.7 Memory capsules (basic)
- Partners add photos, notes, and/or voice to a capsule.
- A capsule can be **opened immediately** or given a simple **open date** to be revealed later.
- Capsules are private to the couple; content is never analyzed by AI in MVP.
- Locked capsule content is enforced at the data layer: private content is stored separately from capsule metadata and must not leak through timeline summaries.

### 11.8 Private timeline
- A reverse-chronological, partner-only feed aggregating pulses, joined moments, completed rituals, and capsule events.
- This is the couple's living memory. It is never public and never shareable outside the couple space.

### 11.9 Emotional tone tagging
- A small fixed palette of tones attachable to signals and entries.
- Used to help partners attune ("they're feeling low today") and to subtly warm the UI — not to produce analytics or scores.

### 11.10 Quiet hours & notifications
- Each partner sets quiet hours in their own time zone.
- Outgoing reaches respect the **recipient's** quiet hours: deliver later rather than disturb.
- See Section 13 for full notification principles.

### 11.11 Privacy controls
- Pause/mute notifications, leave the couple space, export data, and delete account/data.
- Leaving or deletion is handled gracefully and clearly (see Section 12).

---

## 12. Privacy and emotional safety principles

Privacy is not a feature in Tara — it is the foundation. Emotional safety is treated with the same seriousness as data security.

**Data privacy & isolation**
- **Two-partner isolation is absolute.** All content belongs to a couple space; a partner can only ever access data from their own couple space. This is enforced at the data layer (row-level security), not just the UI. (See `rls-policies.md`.)
- **Private by default.** There are no public surfaces, profiles, links, or shares. Nothing in Tara is discoverable by anyone outside the couple.
- **Sensitive reveal rules are data-enforced.** Locked capsule content and ritual partner responses are protected by RLS/RPC checks, never by UI hiding alone.
- **Data minimization.** Collect only what a feature needs. No exact GPS/location in MVP.
- **User control of data.** Each partner can export and delete their data and account.

**Consent & presence**
- **Presence is intentional and opt-in.** No "last seen," no ambient activity broadcasting, no read receipts by default. A partner chooses when to signal presence.
- **No surveillance mechanics.** Tara never lets one partner covertly monitor the other.

**Emotional safety**
- **No guilt or pressure mechanics.** No punishing streaks, no "your partner hasn't replied," no manipulative re-engagement. Missing a day is always okay.
- **Supportive, not therapeutic.** Tara holds space for feelings without clinical framing, advice, or diagnosis. Where appropriate, point to outside help rather than pretending to be it.
- **Graceful pause and exit.** Partners can mute/pause without drama. If a partner leaves or the relationship ends, handle it with dignity: clear messaging, no hostage data, and a clean way to remove shared content.
- **No AI reading private memories in MVP.** Capsules, timeline, and signals are not fed to AI.

**Safety guardrails to keep in mind during build**
- Default settings must be the safe/private ones; safety is never opt-in-only.
- Any future presence feature must be mutual, explicit, reversible, and non-surveillance (no default-on or GPS-style tracking).

---

## 13. Notification principles

Notifications are the most intrusive surface Tara has, so they get the strictest rules. A notification should feel like a **gift, not a demand**.

- **Time-zone aware.** Every notification is evaluated against the **recipient's** local time, not the sender's.
- **Quiet hours are sacred.** During a partner's quiet hours, defer delivery (e.g., until morning) rather than disturb. Truly nothing wakes them by default.
- **Gentle, never nagging.** No guilt, urgency, or FOMO. We never tell someone their partner is waiting, ignoring, or behind.
- **Meaningful over frequent.** Prefer few, warm notifications. Batch where it makes sense. Silence is acceptable and often correct.
- **No manipulative re-engagement.** No fake activity, no "we miss you," no dark patterns designed to pull users back.
- **Per-partner control.** Each partner controls their own notification types, quiet hours, and can pause everything easily.
- **Invitations, not obligations.** A notification offers a chance to connect; it never implies the recipient owes a response.
- **Honest timing copy.** When deferring, be transparent and warm: "It's night for them — we'll deliver this when they wake."

---

## 14. Success criteria for MVP

Success is measured by **relationship value to the couple**, not engagement maximization. We deliberately avoid vanity metrics and anything that would reward addictive or guilt-driven usage.

**Activation**
- A high share of invited second partners successfully join, so a real couple space is formed (both partners present).
- Both partners complete first meaningful actions (send a signal, set a countdown) in the first session/week.

**Healthy ongoing value**
- A majority of active couples exchange at least a few lightweight signals per week **without** it feeling like an obligation (qualitatively confirmed).
- The reunion countdown and timeline are used and revisited (signals that anticipation and memory are landing).
- Retention is measured at the **couple** level over ~4 weeks: are both partners still finding it worth opening?

**Emotional outcome (qualitative)**
- Partners self-report feeling "closer," "more in sync," or "less far apart" when using Tara.
- Partners report that notifications feel respectful and well-timed (few complaints about bad-timing or intrusive pings).

**Safety & trust (must-pass)**
- **Zero privacy incidents:** no couple's data ever visible to anyone outside that couple space.
- No reported instances of guilt/pressure mechanics or surveillance-feeling behavior.
- Quiet hours are honored reliably across time zones.

**Anti-metrics (we do NOT optimize for):** raw session length, daily-open streaks, notification-driven re-engagement rates, message volume. Growth via virality/discovery is explicitly out of scope.

---

## 15. Future roadmap (post-MVP — NOT in scope now)

Everything below is **explicitly out of MVP** and listed only to capture direction. None of it should influence MVP build decisions, and none of it overrides the non-goals in Section 8. Items here are candidates, not commitments.

**Deepen existing features**
- Custom and richer **rituals** (couple-defined prompts, weekly/seasonal rituals, shared journaling).
- Richer **parallel moments** (synchronized media, "watch together," live presence during a moment, calls).
- A fuller **memory vault** (capsule themes, collaborative albums, anniversary resurfacing — still private, still no AI in/out without explicit consent).
- Expanded **emotional tone** as opt-in, partner-visible mood sharing (still not analytics/scoring, still not therapeutic).

**Connection enhancements**
- Optional, **mutual and explicit** availability check-ins (e.g., "free now") with no GPS or exact location data. Never default-on.
- Shared planning tools for reunions (trips, lists) tied to the countdown.
- Multiple couple-space support edge cases / relationship transitions.

**Platform & polish**
- Wearable/companion surfaces for ultra-light pulses.
- Localization and broader accessibility.
- Optional, privacy-preserving assistance features — only with explicit consent and never reading private memories silently.

**Explicitly still NOT planned (reaffirming non-goals):** dating/discovery, public profiles or followers, social feed, generic high-volume chat, covert tracking, guilt-based streaks, and the MVP monetization items (subscriptions, paywalls, RevenueCat). If monetization is ever explored, it will be a separate, principle-aligned decision — not part of this roadmap.

---

## Open questions

These do not block Phase 0 progress; defaults are noted where reasonable.

- **Platform priority:** mobile-first (iOS/Android) is assumed given notifications and presence; is a web client in scope at all for MVP? *(Default: mobile-first, web deferred.)*
- **Relationship end / unpairing:** what exactly happens to shared content (timeline, capsules) when a partner leaves or the couple separates — joint delete, individual export, grace period? Needs a clear, humane policy.
- **Presence pulse vocabulary:** the exact starting set of love signals and emotional tones (which presets ship in MVP).
- **Quiet hours defaults:** sensible default window and whether Tara infers time zone automatically vs. asks.
- **Parallel moment timing:** MVP is now-invite only; decide post-MVP whether simple scheduled invites are worth adding.
- **Memory capsule open conditions:** date-based only for MVP, or also "on reunion" (tied to countdown)? *(Default: date-based only.)*
- **Identity & recovery:** auth method(s) and account recovery flow (owned by `architecture.md`).
