# Tara RLS Policies (Phase 0)

> Status: Phase 0 RLS and privacy strategy. This document describes the intended Supabase Row Level Security model for Tara's MVP. It is not a migration and does not implement SQL. Phase 2 should translate this strategy into schema constraints, helper functions, policies, RPCs, storage policies, and tests.

## 1. RLS goals

Tara's backend privacy model exists to protect one small space shared by exactly two partners.

- Enforce couple isolation in Postgres, not only in client routes, hooks, or UI state.
- Allow only active members of a couple to access couple-owned rows.
- Prevent any public profile directory, social graph, or broad authenticated read path.
- Keep sensitive flows server-validated and transactional: pairing, invite acceptance, memory capsule opening, and any future deletion/export flows.
- Make locked private content unreadable before the controlled open state even if a client has a row id, object path, or stale UI state.
- Hide ritual partner responses until both active partners have completed the same ritual occurrence.
- Keep notification, Realtime, and Storage access aligned with the same couple-membership boundary as database rows.

## 2. Core RLS principles

- Enable RLS on every exposed application table in Phase 2 before any client access.
- Default to deny. Every policy should be explicit about the operation, membership status, and ownership checks it allows.
- Treat `couple_id` as the tenant boundary for every shared feature table.
- Use `auth.uid()` only for the currently authenticated user; never trust user-supplied `user_id`, `sender_id`, `actor_id`, `created_by`, or `uploaded_by` without a `WITH CHECK` policy.
- No policy on a private table should say "all authenticated users can select all rows."
- Personal tables are scoped to the owning user unless the product explicitly allows partner visibility.
- Shared couple tables are scoped to active couple membership, not merely to knowing a `couple_id`.
- MVP has no admin/owner hierarchy inside a couple. Both active partners are equal members.
- Prefer append-only product event tables where the product does not need edits or deletes.
- Keep private locked capsule content out of metadata, timeline rows, notifications, logs, and Storage paths that reveal the secret.
- Do not depend on UI hiding for sensitive workflows. If a row or object must be private, RLS and RPC checks must enforce it.

## 3. Helper functions required, described but not implemented

These helpers should be created in Phase 2 before writing table policies. If any helper must bypass RLS to avoid recursive policy checks, it should be implemented with the `security definer` cautions in Section 4.

### `is_active_couple_member(target_couple_id uuid, target_user_id uuid default auth.uid())`

Purpose:

- Returns whether `target_user_id` is an active member of `target_couple_id`.

Expected checks:

- `target_user_id` is not null.
- A `couple_members` row exists for `(couple_id = target_couple_id, user_id = target_user_id, status = 'active')`.
- The referenced `couples` row is also `status = 'active'`.

Primary uses:

- `SELECT`, `INSERT`, and `UPDATE` policies for couple-owned tables.
- Storage object policies for the private `couple-media` bucket.
- RPC preconditions for memory capsules, rituals, timeline creation, and notification event creation.

### `is_same_active_couple_member(target_user_id uuid, viewer_user_id uuid default auth.uid())`

Purpose:

- Returns whether `target_user_id` and `viewer_user_id` are both active members of the same active couple.

Expected checks:

- Both users are non-null.
- Both users have active `couple_members` rows for the same active `couples.id`.
- The MVP one-active-couple-per-user invariant is respected.

Primary uses:

- Partner profile reads.
- Any future workflow that receives a user id and must confirm the viewer is that user's active partner.

### `active_couple_member_count(target_couple_id uuid)`

Purpose:

- Returns the number of active members in a couple.

Expected checks:

- Counts `couple_members` rows where `couple_id = target_couple_id` and `status = 'active'`.
- Used only inside locked, transactional workflows or constraints where race protection matters.

Primary uses:

- `create_couple_with_invite`.
- `accept_couple_invite`.
- Any trigger or RPC that enforces the maximum of two active members per couple.

## 4. Security definer function cautions

Some helper functions and RPC workflows may need `security definer` so they can safely inspect membership rows while RLS is enabled. Use that power narrowly.

- Keep `security definer` functions in a private, unexposed schema rather than the public API schema.
- Set a fixed `search_path` inside each function so an attacker cannot influence object resolution.
- Grant execute only to the roles that need the function.
- Do not accept caller-provided user ids for sensitive operations when `auth.uid()` is the real actor.
- Validate every relationship inside the function, even when the client already supplied ids.
- Avoid returning private implementation details from failure cases. For invites especially, errors should not reveal whether a couple exists, who created it, or whether it is already full.
- Make transactional workflows idempotent where reasonable, but never by weakening authorization checks.
- Never expose `service_role` keys to the client. Privileged workflows should run through controlled RPCs or server-side code.

## 5. Table-by-table RLS matrix

### `profiles`

| Operation | Policy intent |
| --- | --- |
| `SELECT` | User can read their own profile. User can read the profile of their active partner using `is_same_active_couple_member(id)`. No global profile directory. |
| `INSERT` | User can create only their own profile row where `id = auth.uid()`. |
| `UPDATE` | User can update only their own profile row where `id = auth.uid()`. |
| `DELETE` | No direct client delete in MVP. Account deletion should use a later server-controlled workflow. |

Notes:

- Partner profile visibility exists only because the two-person couple experience needs names, avatars, and coarse profile context.
- Do not expose profile search by email, name, city, or invite code.

### `couples`

| Operation | Policy intent |
| --- | --- |
| `SELECT` | Active members can read their active couple row using `is_active_couple_member(id)`. |
| `INSERT` | No direct client insert. Creation should happen through `create_couple_with_invite`. |
| `UPDATE` | Active members can update safe shared fields such as anniversary date and reunion countdown fields. Status changes should use controlled workflows. |
| `DELETE` | No direct client delete in MVP. Ending/deleting a couple requires a later server-controlled flow. |

Notes:

- Access is based on active membership, not `created_by`.
- Updates should not allow arbitrary changes to `status`, `created_by`, or audit fields.

### `couple_members`

| Operation | Policy intent |
| --- | --- |
| `SELECT` | Members can read membership rows for their own active couple using `is_active_couple_member(couple_id)`. |
| `INSERT` | No direct client insert. Creator membership comes from `create_couple_with_invite`; partner membership comes from `accept_couple_invite`. |
| `UPDATE` | No broad client update in MVP. Future leave/remove flows should be server-controlled. |
| `DELETE` | No direct delete in MVP. Preserve lifecycle history with statuses such as `left` or `removed`. |

Notes:

- The maximum of two active members must be enforced transactionally, not by the client.
- A user should have only one active couple in MVP.

### `couple_invites`

| Operation | Policy intent |
| --- | --- |
| `SELECT` | Active couple members can read invites for their couple. The invite acceptance lookup by code should happen inside `accept_couple_invite`, not through broad direct reads. |
| `INSERT` | Active couple members can create invites for their couple only through a controlled workflow or tightly scoped insert policy. Prefer `create_couple_with_invite` for initial pairing. |
| `UPDATE` | Revocation may be allowed only for active couple members and only from `pending` to `revoked`, or handled by RPC. Acceptance must happen through `accept_couple_invite`. |
| `DELETE` | No direct delete in MVP. Use status transitions for auditability and race safety. |

Notes:

- Expired, revoked, and accepted invites cannot be accepted.
- Acceptance must validate invite status, expiry, accepting user, existing active couple membership, and active member count in one transaction.
- Phase 2 should consider storing invite code hashes rather than raw invite codes.

### `user_settings`

| Operation | Policy intent |
| --- | --- |
| `SELECT` | User can read only their own settings where `user_id = auth.uid()`. |
| `INSERT` | User can insert only their own settings row. |
| `UPDATE` | User can update only their own settings row. |
| `DELETE` | No direct delete in MVP. Account deletion workflow handles cleanup. |

Notes:

- These settings are private preferences, not partner-visible profile fields.
- Do not use this table for last-seen or ambient activity.

### `couple_settings`

| Operation | Policy intent |
| --- | --- |
| `SELECT` | Active couple members can read settings for their couple. |
| `INSERT` | Prefer server-created defaults during `create_couple_with_invite`. Direct insert is not needed in MVP. |
| `UPDATE` | Active couple members can update safe shared settings for their couple. |
| `DELETE` | No direct delete in MVP. |

Notes:

- Couple settings cannot override recipient-level quiet hours or notification pauses.

### `presence_events`

| Operation | Policy intent |
| --- | --- |
| `SELECT` | Active couple members can read presence events for their couple. |
| `INSERT` | Sender can insert only when `sender_id = auth.uid()` and `is_active_couple_member(couple_id, auth.uid())`. |
| `UPDATE` | No updates in MVP. Presence events are append-only. |
| `DELETE` | No deletes in MVP. |

Notes:

- Presence is intentional, not ambient. Do not add automatic "online" writes or last-seen semantics.
- Optional messages remain couple-private and should stay short.

### `ritual_templates`

| Operation | Policy intent |
| --- | --- |
| `SELECT` | Authenticated users may read active preset templates. This is product reference data, not private couple data. |
| `INSERT` | No client insert. Templates are product-managed. |
| `UPDATE` | No client update. Templates are product-managed. |
| `DELETE` | No client delete. Templates are product-managed. |

Notes:

- This is the only table in this matrix that may be broadly readable by authenticated users because it does not contain private user or couple data.
- If inactive templates should remain hidden from clients, the policy or query layer should filter to `is_active = true`.

### `couple_rituals`

| Operation | Policy intent |
| --- | --- |
| `SELECT` | Active couple members can read rituals enabled for their couple. |
| `INSERT` | Active couple members can enable a ritual only for their couple, with `created_by = auth.uid()`. |
| `UPDATE` | Active couple members can update safe ritual settings such as status or reminder time for their couple. |
| `DELETE` | No direct delete in MVP. Archive or pause instead. |

Notes:

- No streak counters or penalty fields.
- Insert/update checks must ensure the selected template is valid and the ritual belongs to the actor's couple.

### `ritual_completions`

| Operation | Policy intent |
| --- | --- |
| `SELECT` | Active couple member can read their own completion. The partner completion is readable only after both active partners have completed the same `couple_ritual_id` and `occurrence_date`. |
| `INSERT` | User can insert only their own completion where `user_id = auth.uid()` and they are an active member of the completion's `couple_id`. |
| `UPDATE` | User can update only their own completion. Consider limiting updates after the partner response becomes visible. |
| `DELETE` | No direct delete in MVP. |

Notes:

- The partner-response visibility rule must be enforced by RLS or a security-checked read RPC, not by hiding fields in the client.
- Because Postgres RLS is row-level, if metadata about partner completion needs to be visible before the response text, Phase 2 may need a separate safe view or table shape. Do not expose `response_text` early.
- The "both partners completed" check reads `ritual_completions` from inside a `ritual_completions` policy, which can trigger RLS recursion. Phase 2 should wrap this in a `security definer` predicate helper (for example `both_partners_completed(target_couple_ritual_id uuid, target_occurrence_date date)`) that bypasses RLS, rather than an inline self-referential subquery.

### `memory_capsules`

| Operation | Policy intent |
| --- | --- |
| `SELECT` | Active couple members can read capsule metadata for their couple. |
| `INSERT` | Creator can create a capsule only for their active couple with `created_by = auth.uid()`. |
| `UPDATE` | Safe metadata updates may be allowed for active couple members. Opening must happen through `open_memory_capsule`. |
| `DELETE` | No direct delete in MVP. Archive or later deletion workflow only. |

Notes:

- This table must contain metadata only. Do not store private note text, media paths that reveal content, or locked content here.
- `status`, `opened_by`, and `opened_at` changes should be controlled by RPC.

### `memory_capsule_contents`

| Operation | Policy intent |
| --- | --- |
| `SELECT` | Active couple member can read content rows for their couple only under strict gates: creator can read their own content before and after open; the partner can read only when the parent capsule is `status = 'open'`. |
| `INSERT` | Creator can insert content only for a capsule in their active couple with `created_by = auth.uid()`. |
| `UPDATE` | Creator can update their own content before open only. No partner update. |
| `DELETE` | No direct delete in MVP unless a later content deletion policy is explicitly designed. |

Notes:

- Do not rely on UI hiding. A locked content row must not be readable by the partner through direct API calls, joins, timeline rows, Storage URLs, or Realtime payloads.
- Use `memory_capsules.status = 'open'` as the single read gate for partner access. `open_memory_capsule` must enforce unlock timing (including `unlock_at <= now()` for scheduled capsules) before changing status.

### `timeline_items`

| Operation | Policy intent |
| --- | --- |
| `SELECT` | Active couple members can read timeline items for their couple. |
| `INSERT` | Insert only for an active couple where `actor_id = auth.uid()`, or through a controlled server flow for system-generated rows. |
| `UPDATE` | No broad updates in MVP. Controlled correction/source-lifecycle updates only if needed. |
| `DELETE` | No direct delete in MVP. |

Notes:

- Timeline rows must never duplicate locked capsule content or private media paths.
- `actor_id` can be null only for controlled system-generated rows, not arbitrary client inserts.

### `media_assets`

| Operation | Policy intent |
| --- | --- |
| `SELECT` | Active couple members can read media metadata for their couple. Capsule-related metadata may need additional unlock checks if the metadata itself reveals private content. |
| `INSERT` | Owner can insert media metadata only when `uploaded_by = auth.uid()` and they are an active member of `couple_id`. |
| `UPDATE` | Owner can update their own media metadata while active. Status changes to deleted should follow the future deletion policy. |
| `DELETE` | No direct delete in MVP unless coordinated with Storage cleanup. |

Notes:

- Metadata RLS is not enough. Storage object access must also be scoped by couple membership and the parent capsule's open state where relevant.
- Upload flows should strip or avoid exact GPS/EXIF metadata.

### `push_tokens`

| Operation | Policy intent |
| --- | --- |
| `SELECT` | User can read only their own token rows where `user_id = auth.uid()`. |
| `INSERT` | User can register only their own token. |
| `UPDATE` | User can update or revoke only their own token. Server-side notification workers may need privileged access outside client RLS. |
| `DELETE` | Prefer revoke/update over direct delete in MVP. |

Notes:

- Push tokens are sensitive operational data. Partners should not read each other's tokens.
- Do not use this table for presence, activity tracking, or last-seen behavior.

### `notification_preferences`

| Operation | Policy intent |
| --- | --- |
| `SELECT` | User can read only their own preferences. |
| `INSERT` | User can create only their own preferences. |
| `UPDATE` | User can update only their own preferences. |
| `DELETE` | No direct delete in MVP. |

Notes:

- Recipient preferences, quiet hours, and pauses always win over sender intent.
- Preferences must not become partner-visible pressure signals.

## 6. RPC workflows and required checks

### `create_couple_with_invite`

This should be the primary way to create a couple and first invite.

Required checks and behavior:

- Require `auth.uid()` and a completed or creatable profile for the caller.
- Verify the caller has no active couple.
- Create an active `couples` row with `created_by = auth.uid()`.
- Create the caller's active `couple_members` row.
- Create default `couple_settings`.
- Create one pending, high-entropy, time-limited invite for the couple.
- Return only the fields the client needs, such as `couple_id`, `invite_id`, `invite_code`, and `expires_at`.
- Run all writes in one transaction so the system cannot leave an orphaned couple, membership, settings row, or invite.

Security notes:

- Protect the one-active-couple invariant with a partial unique index and transactional handling.
- Consider storing invite code hashes before Phase 2 migrations are finalized.
- Do not allow clients to choose another user's `created_by` or create memberships for arbitrary users.

### `accept_couple_invite`

Invite acceptance must be atomic and server-validated.

Required checks and behavior:

- Require `auth.uid()`.
- Look up the invite by submitted code or code hash.
- Validate the invite is `pending`.
- Validate `expires_at > now()`.
- Reject revoked, expired, or already accepted invites.
- Verify the accepting user has no active couple.
- Prevent the invite creator from accepting their own invite as the second partner.
- Lock the invite and/or relevant membership rows so concurrent acceptances cannot create a third active member.
- Validate `active_couple_member_count(couple_id) < 2` inside the same transaction as the insert.
- Insert the accepting user's active `couple_members` row.
- Mark the invite `accepted` with `accepted_by = auth.uid()` and `accepted_at = now()`.
- Optionally create a safe `partner_joined` timeline item with no private profile details beyond what active members may already read.

Security notes:

- Error messages should be calm and non-enumerating, such as "This invite is no longer available."
- Do not expose couple metadata to unauthenticated users or users who fail acceptance checks.
- The client must not directly insert `couple_members` to join a couple.

### `open_memory_capsule`

Opening must be controlled because it changes private content readability.

Required checks and behavior:

- Require `auth.uid()`.
- Load the capsule and verify `is_active_couple_member(couple_id, auth.uid())`.
- Verify unlock rules:
  - immediate capsules may open immediately, and
  - scheduled capsules may open only when `unlock_at <= now()`.
- Reject archived/deleted capsules.
- Mark the capsule `status = 'open'`, `opened_by = auth.uid()`, and `opened_at = now()`.
- Treat repeated opens as idempotent when the capsule is already open and the caller is an active couple member.
- Create a timeline item that announces the capsule opened without copying note text, media paths, or other private content.

Security notes:

- The `memory_capsule_contents` `SELECT` policy must match the same controlled open-state rule.
- Do not leak locked content through RPC return payloads, errors, logs, Realtime broadcasts, notifications, or Storage signed URLs.

## 7. Storage RLS strategy for a private couple-media bucket

Use one private Supabase Storage bucket for MVP media:

- Bucket name: `couple-media`.
- Bucket visibility: private, never public.
- Recommended path: `couples/{couple_id}/capsules/{capsule_id}/{media_asset_id}/{filename}` for capsule media.

Storage policy strategy:

- Require a matching `media_assets` row for every object.
- Derive access from `media_assets.couple_id` and `is_active_couple_member(media_assets.couple_id)`.
- For capsule media, join through `memory_capsule_contents` and `memory_capsules` so locked media follows the same read gate as locked notes.
- Allow uploads only when the object path's `couple_id` matches a couple where the uploader is active, and the pending `media_assets.uploaded_by` is `auth.uid()`.
- Avoid broad object listing across the bucket. Listing should be scoped to the user's active couple path and, for capsules, to content the user may read.
- Signed URLs, if used, should be short lived and generated only after the same authorization checks pass.
- Storage upserts need explicit thought: replacing an object requires insert/select/update-style permissions in Supabase Storage. Prefer non-overwriting object paths for MVP unless replacement semantics are required.
- Media deletion must coordinate Storage object removal with `media_assets.status`; defer the exact deletion lifecycle to later privacy controls.

## 8. Realtime security expectations

Realtime is a UX accelerator, not an authorization layer.

- Realtime subscriptions must be scoped to the active couple and active screens.
- Realtime payloads must not include rows the user could not select through RLS.
- Locked memory capsule content should not broadcast to the partner before the capsule is open.
- Partner ritual completions should not broadcast response text before both partners complete the same occurrence.
- Reconnect handling should re-query authoritative tables instead of trusting missed or cached Realtime events.
- Presence events are intentional product events, not ambient online status.
- Channels, topics, or filters should not reveal private couple ids to users who are not active members.

## 9. Notification privacy expectations

Notifications are visible outside the app and should be treated as a sensitive privacy surface.

- Notification workers must verify recipient membership and preferences server-side before delivery.
- Recipient quiet hours, pauses, and per-type preferences always override sender intent.
- Push payloads should be minimal and non-sensitive. Prefer generic copy and deep-link ids over private note text, ritual responses, media paths, or locked capsule content.
- Never include locked memory capsule content in a notification before the capsule is open.
- Never include a partner's ritual response before both partners have completed.
- Do not expose push tokens to partners or clients other than the owning user.
- Avoid guilt, urgency, read-receipt, last-seen, or "your partner is waiting" notification semantics.

## 10. Abuse, exit, and deletion considerations for later phases

Phase 0 does not design full trust-and-safety workflows, but RLS should leave room for them.

- Leaving a couple: define whether membership becomes `left`, whether the remaining partner keeps access, and what happens to shared timeline/capsules.
- Relationship ending: create humane flows for export, deletion, and shared-content handling without trapping either partner.
- Account deletion: decide how to delete or anonymize user-owned personal data while preserving or removing couple-shared rows.
- Revocation: when a member leaves or is removed, active membership must stop granting reads immediately.
- Invite abuse: add rate limits, expiry, revocation, and non-enumerating errors.
- Device loss: token revocation and session management should remove push access quickly.
- Audit logging: consider minimal security audit logs for sensitive actions without turning them into surveillance.
- Block/report flows: not in MVP, but future safety work may require carefully scoped server-only records.
- Exports: exports should be server-generated with the same authorization gates as normal reads, including locked capsule and ritual response rules.

## 11. RLS test scenarios for Phase 2

Phase 2 should include automated RLS tests with at least three users: partner A, partner B, and outsider C.

- Outsider C cannot read A or B profiles, their couple row, membership rows, settings, presence events, rituals, completions, capsules, timeline, media metadata, push tokens, or notification preferences.
- Partner A can read A profile and B profile after both are active members of the same couple.
- Partner A cannot read B profile before invite acceptance creates active membership.
- No authenticated user can list all profiles.
- Partner A can read only their active couple row and cannot read another couple's row by id.
- Direct `couples` insert fails; `create_couple_with_invite` succeeds for an unpaired user.
- A user who already has an active couple cannot create another active couple.
- Direct `couple_members` insert fails for normal clients.
- `accept_couple_invite` succeeds once for a valid pending invite and creates exactly two active members.
- `accept_couple_invite` rejects expired, revoked, accepted, invalid, self-accepted, and over-capacity invites.
- Two concurrent invite acceptances cannot create three active members.
- Partner A can insert a `presence_events` row only with `sender_id = auth.uid()` and their active `couple_id`.
- Partner A cannot update or delete presence events.
- Partner A can read their own ritual completion immediately.
- Partner A cannot read B's ritual response until B and A have both completed the same ritual occurrence.
- After both partners complete, each can read the other's response for that occurrence only.
- Partner A cannot insert or update a ritual completion for B.
- Partner A and B can read memory capsule metadata for their active couple.
- Partner B cannot read A's locked `memory_capsule_contents` before the capsule is open.
- Creator A can read and update their own capsule content before open.
- Creator A cannot update capsule content after open if Phase 2 chooses immutable opened content.
- `open_memory_capsule` rejects early scheduled opens and succeeds at or after `unlock_at`.
- After a capsule is open, both active partners can read its contents.
- Timeline rows for locked capsules do not contain private note text, media paths, or object names that reveal content.
- `media_assets` metadata is readable only by active couple members.
- Storage reads fail for outsiders even with guessed object paths.
- Storage reads for capsule media fail for the partner before open and succeed after open.
- Users can read, insert, update, and revoke only their own push tokens.
- Users can read and update only their own notification preferences.
- Realtime subscriptions do not deliver rows hidden by RLS, including locked capsule content and hidden ritual responses.

## 12. Common RLS mistakes to avoid

- Writing `authenticated users can select all rows` on any private table.
- Enforcing couple membership only in React Native route guards or TanStack Query filters.
- Letting clients directly insert membership rows during invite acceptance.
- Checking invite validity in multiple client-visible steps instead of one transaction.
- Forgetting that `UPDATE` policies also need compatible row visibility.
- Trusting caller-supplied `user_id`, `sender_id`, `actor_id`, `created_by`, or `uploaded_by`.
- Using user-editable auth metadata for authorization decisions.
- Creating `security definer` functions in exposed schemas or without a fixed `search_path`.
- Allowing a helper function to recurse through the same RLS policy it is meant to support.
- Writing a `SELECT` policy whose own subquery reads the same table it protects, such as the `ritual_completions` "both completed" check or a `couple_members` policy that re-queries `couple_members`; use a `security definer` predicate instead.
- Putting private locked capsule content into metadata, timeline rows, notification payloads, logs, or Storage paths.
- Assuming column hiding is enough for `memory_capsule_contents`; RLS is row-level.
- Allowing partner ritual response reads before both partners complete.
- Forgetting that Storage needs its own policies separate from Postgres metadata policies.
- Making the `couple-media` bucket public for convenience.
- Issuing long-lived signed URLs for sensitive media.
- Broadcasting Realtime events that contain private data before RLS would allow a normal select.
- Treating notification copy as harmless. Push notifications can expose private content on lock screens.
- Building delete/leave flows as direct client deletes before the product has a clear data lifecycle policy.
