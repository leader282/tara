# Tara Database Design (Phase 0)

> Status: Phase 0 database design. This is a practical first database model for Tara's MVP on Supabase Postgres. It is not a migration, does not define final RLS policies, and should be translated into migrations during Phase 2.

## 1. Database goals

- Model Tara as one private couple space for exactly two partners.
- Make `couple_id` the tenant boundary for all shared product data.
- Keep personal account/profile data private to the authenticated user and their active couple only where needed.
- Enforce the MVP rule that a user can have only one active couple.
- Use a flexible `couple_members` table instead of hardcoded `partner_a_id` / `partner_b_id` columns.
- Prepare for a database/RPC-level limit of maximum two active members per couple.
- Keep all shared data private to active couple members through Supabase RLS in Phase 2.
- Avoid public-profile, social graph, chat, read-receipt, last-seen, and exact-location structures.
- Split locked memory capsule metadata from private capsule content because Postgres RLS is row-level, not column-level.

Privacy-sensitive baseline:

- `memory_capsules` stores metadata only.
- `memory_capsule_contents` stores private notes and media links.
- Locked capsule content must not be readable by the partner until the capsule is opened through the controlled workflow, even though capsule metadata may be visible.
- Timeline entries for locked capsules must not duplicate private note/media content.
- Location fields are coarse human-entered labels only, never coordinates.

## 2. General conventions

- Use `uuid` primary keys for application tables. `profiles.id` is the exception-shaped primary key: it is the user's `auth.users.id`, which is also a `uuid`.
- Use `timestamptz` for absolute times such as creation timestamps, invite expiry, unlock times, and meetup times.
- Use `date` for calendar-only values such as birthdays, anniversaries, and ritual occurrence dates.
- Use `time` only for local preference values such as quiet-hours windows or reminder times.
- Use `created_at` and `updated_at` on mutable tables. Append-only event tables may use `created_at` only.
- Default `created_at` to `now()` in migrations.
- Maintain `updated_at` with a shared trigger in Phase 2.
- Prefer `text` plus check constraints for MVP status/type fields unless Phase 2 chooses Postgres enums deliberately.
- Add check constraints for status values, type values, positive byte counts, text lengths, valid quiet-hours windows, and valid unlock combinations.
- Add foreign keys for ownership and tenant relationships. Use restrictive deletes by default, and only use cascades where the child row has no meaning without the parent.
- Treat `created_by`, `uploaded_by`, and `actor_id` as authorship/provenance fields, not owner-admin permissions. Access is always derived from active couple membership and explicit policy checks.
- Add indexes for every foreign key used in joins, every list screen sort pattern, and every partial uniqueness rule.
- Enable RLS on every exposed table in Phase 2 before client access.
- Keep helper functions and privileged RPCs out of exposed schemas when they need `security definer`.
- Generate Supabase TypeScript types after Phase 2 migrations land and keep `src/lib/supabase/database.types.ts` generated, not hand-authored.

## 3. Table overview

- `profiles`: private user profile data linked 1:1 with Supabase Auth users.
- `couples`: the private couple space and shared countdown metadata.
- `couple_members`: flexible membership rows for partners in a couple.
- `couple_invites`: single-use invites for adding the second partner.
- `user_settings`: per-user app preferences such as quiet hours.
- `couple_settings`: shared couple-level preferences.
- `presence_events`: intentional presence pulses and love signals.
- `ritual_templates`: global preset ritual definitions.
- `couple_rituals`: rituals enabled by a couple.
- `ritual_completions`: one partner's completion of one ritual occurrence.
- `memory_capsules`: metadata for capsules, including lock/open state.
- `memory_capsule_contents`: private capsule note/media content.
- `timeline_items`: append-mostly private couple timeline entries.
- `media_assets`: Postgres metadata for files stored in Supabase Storage.
- `push_tokens`: device push tokens for future notifications.
- `notification_preferences`: per-user notification type preferences.

## 4. Full first-pass schema

### `profiles`

Private user profile row, keyed by Supabase Auth user id. There are no public profiles in Tara.

Fields:

- `id uuid primary key references auth.users(id)`: user identity from Supabase Auth.
- `display_name text not null`: user-chosen display name, recommended max length 80.
- `avatar_url text null`: optional private avatar reference or URL. Not publicly discoverable.
- `timezone text not null`: IANA timezone such as `Asia/Kolkata`; used for local display and notification scheduling.
- `birthday date null`: optional calendar birthday.
- `city text null`: optional coarse city label, recommended max length 120. Do not store exact address or coordinates.
- `country text null`: optional country label or ISO country code.
- `onboarding_completed boolean not null default false`: gates entry into the paired app experience.
- `created_at timestamptz not null`.
- `updated_at timestamptz not null`.

Constraints:

- `id` must match the authenticated user.
- `display_name` cannot be empty after trimming.
- `timezone` should be validated by the app and may be constrained later if Phase 2 adds a timezone validation strategy.

### `couples`

The couple space is the root tenant for shared Tara data.

Fields:

- `id uuid primary key`.
- `status text not null default 'active'`: expected values `active`, `ended`, `deleted`.
- `anniversary_date date null`: optional shared anniversary date.
- `next_meetup_at timestamptz null`: optional reunion countdown target.
- `next_meetup_location text null`: optional human-entered coarse label, recommended max length 160. No exact GPS or address requirement.
- `created_by uuid not null references profiles(id)`: user who created the space.
- `created_at timestamptz not null`.
- `updated_at timestamptz not null`.

Constraints:

- `status` must be one of the allowed values.
- `next_meetup_location` must remain a label only; no latitude/longitude columns in MVP.
- Couple access is always mediated through active membership, not through `created_by`.

### `couple_members`

Flexible membership table for exactly two active partners in MVP.

Fields:

- `id uuid primary key`.
- `couple_id uuid not null references couples(id)`.
- `user_id uuid not null references profiles(id)`.
- `role text not null default 'partner'`: expected value `partner` in MVP.
- `status text not null default 'active'`: expected values `active`, `invited`, `left`, `removed`.
- `joined_at timestamptz null`: set when the user becomes an active partner.
- `created_at timestamptz not null`.
- `updated_at timestamptz not null`.

Constraints:

- Unique `(couple_id, user_id)`.
- One active couple per user in MVP via a partial unique index on `(user_id)` where `status = 'active'`.
- Maximum two active members per couple must be enforced later by a trigger/RPC workflow, not only by client code.
- `joined_at` should be non-null when `status = 'active'`.
- `role` is intentionally flexible but should only allow `partner` for MVP.

### `couple_invites`

Single-use invite records for adding the second partner to a couple.

Fields:

- `id uuid primary key`.
- `couple_id uuid not null references couples(id)`.
- `created_by uuid not null references profiles(id)`.
- `invite_code text not null`: high-entropy code used by the invited partner.
- `status text not null default 'pending'`: expected values `pending`, `accepted`, `expired`, `revoked`.
- `expires_at timestamptz not null`.
- `accepted_by uuid null references profiles(id)`.
- `accepted_at timestamptz null`.
- `created_at timestamptz not null`.

Constraints:

- Unique `invite_code`.
- Only active members of the couple can create invites.
- Only one pending invite per couple is needed for MVP.
- `accepted_by` and `accepted_at` must both be present when `status = 'accepted'`.
- Phase 2 should consider storing only an invite code hash if the UX does not require reading the raw code after creation.

### `user_settings`

Private per-user app settings. These are not shared profile fields.

Fields:

- `user_id uuid primary key references profiles(id)`.
- `quiet_hours_enabled boolean not null default true`.
- `quiet_hours_start_local time null`: recipient-local quiet-hours start.
- `quiet_hours_end_local time null`: recipient-local quiet-hours end.
- `notifications_paused_until timestamptz null`: temporary pause for all notifications.
- `presence_signals_enabled boolean not null default true`: user-level ability to receive presence/love signals.
- `created_at timestamptz not null`.
- `updated_at timestamptz not null`.

Constraints:

- Quiet hours use the user's `profiles.timezone`.
- If `quiet_hours_enabled = true`, both start and end times should be present.
- Cross-midnight quiet-hours windows are valid.
- This table must not become a last-seen or ambient activity store.

### `couple_settings`

Shared settings for the couple space.

Fields:

- `couple_id uuid primary key references couples(id)`.
- `timeline_auto_add_events boolean not null default true`: whether product actions automatically create timeline entries.
- `ritual_reminders_enabled boolean not null default true`.
- `default_ritual_reminder_time_local time null`: optional couple default; recipient quiet hours still win.
- `memory_capsules_enabled boolean not null default true`.
- `created_at timestamptz not null`.
- `updated_at timestamptz not null`.

Constraints:

- Only active couple members can read or update.
- Couple settings must not override a recipient's user-level quiet hours or pause state.

### `presence_events`

Intentional presence pulses and love signals. This is not ambient presence, last-seen, or chat.

Fields:

- `id uuid primary key`.
- `couple_id uuid not null references couples(id)`.
- `sender_id uuid not null references profiles(id)`.
- `type text not null`: expected values such as `thinking_of_you`, `miss_you`, `good_morning`, `goodnight`, `heartbeat`, `hug`.
- `emotional_tone text null`: optional lightweight tone, from a small fixed app palette.
- `optional_message text null`: short optional note, max length 240.
- `created_at timestamptz not null`.

Constraints:

- `sender_id` must be an active member of `couple_id`.
- `optional_message` max length 240.
- Append-only in normal product flows.
- No read receipts, delivery receipts, reply threads, or full chat fields.

### `ritual_templates`

Global preset ritual definitions shipped by the product.

Fields:

- `id uuid primary key`.
- `slug text not null`: stable app identifier such as `daily_check_in`.
- `title text not null`: user-facing title.
- `description text null`: short explanation.
- `prompt text null`: default prompt shown to partners.
- `cadence text not null`: expected values `daily`, `weekly`, `manual`.
- `is_active boolean not null default true`: whether template can be newly enabled.
- `sort_order integer not null default 0`.
- `created_at timestamptz not null`.
- `updated_at timestamptz not null`.

Constraints:

- Unique `slug`.
- `cadence` must be one of the allowed values.
- Templates are readable by authenticated users, but only active templates should be offered in client flows.

### `couple_rituals`

Ritual instances enabled by a couple.

Fields:

- `id uuid primary key`.
- `couple_id uuid not null references couples(id)`.
- `ritual_template_id uuid not null references ritual_templates(id)`.
- `created_by uuid not null references profiles(id)`.
- `status text not null default 'active'`: expected values `active`, `paused`, `archived`.
- `cadence text not null`: copied from template initially, expected values `daily`, `weekly`, `manual`.
- `reminder_time_local time null`: optional local reminder time.
- `created_at timestamptz not null`.
- `updated_at timestamptz not null`.

Constraints:

- `created_by` must be an active member of `couple_id`.
- Unique active ritual per `(couple_id, ritual_template_id)` where `status = 'active'`.
- No streak counters or penalty fields.

### `ritual_completions`

One partner's response for one ritual occurrence. Partner response visibility is delayed until both partners complete the same occurrence.

Fields:

- `id uuid primary key`.
- `couple_id uuid not null references couples(id)`: denormalized for RLS and indexing.
- `couple_ritual_id uuid not null references couple_rituals(id)`.
- `user_id uuid not null references profiles(id)`.
- `occurrence_date date not null`: local/couple occurrence bucket for recurring rituals.
- `response_text text null`: optional ritual response, recommended max length 1000.
- `emotional_tone text null`: optional lightweight tone.
- `completed_at timestamptz not null`.
- `created_at timestamptz not null`.
- `updated_at timestamptz not null`.

Constraints:

- `user_id` must be an active member of `couple_id`.
- `couple_ritual_id` must belong to `couple_id`.
- Unique `(couple_ritual_id, user_id, occurrence_date)` to ensure one completion per user per ritual occurrence.
- RLS later must hide a partner's `response_text` until both active partners have completed that same `couple_ritual_id` and `occurrence_date`.

### `memory_capsules`

Capsule metadata only. Do not store private note text, media paths, or locked content here.

Fields:

- `id uuid primary key`.
- `couple_id uuid not null references couples(id)`.
- `created_by uuid not null references profiles(id)`.
- `title text not null`: recommended max length 120.
- `unlock_type text not null default 'immediate'`: expected values `immediate`, `scheduled`.
- `unlock_at timestamptz null`: required for scheduled capsules.
- `emotional_context text null`: optional lightweight label or short context, recommended max length 240.
- `status text not null default 'locked'`: expected values `locked`, `open`, `archived`.
- `opened_by uuid null references profiles(id)`.
- `opened_at timestamptz null`.
- `created_at timestamptz not null`.
- `updated_at timestamptz not null`.

Constraints:

- `created_by` must be an active member of `couple_id`.
- `unlock_at` must be present when `unlock_type = 'scheduled'`.
- `unlock_at` should be null when `unlock_type = 'immediate'`.
- `opened_by` and `opened_at` must both be present when `status = 'open'`.
- Transitioning `status` to `open` should happen through a controlled workflow (for example `open_memory_capsule`) that validates unlock rules.
- Metadata can be visible to active couple members, but content remains separately protected in `memory_capsule_contents`.

### `memory_capsule_contents`

Private capsule content. Readability depends on creator and the parent capsule's controlled open state.

Fields:

- `id uuid primary key`.
- `capsule_id uuid not null references memory_capsules(id)`.
- `couple_id uuid not null references couples(id)`: denormalized from the capsule for RLS and indexes.
- `created_by uuid not null references profiles(id)`.
- `note text null`: private written content.
- `media_asset_id uuid null references media_assets(id)`.
- `created_at timestamptz not null`.
- `updated_at timestamptz not null`.

Constraints:

- `capsule_id` must belong to `couple_id`.
- `created_by` must be an active member of `couple_id`.
- At least one of `note` or `media_asset_id` must be present.
- `media_asset_id`, when present, must belong to the same `couple_id`.
- RLS later: content is readable by its creator before and after open, and by the partner only after the parent capsule is `status = 'open'`.
- Scheduled capsules should reach `status = 'open'` only when `unlock_at <= now()` is validated by the opening workflow.
- RLS later must not rely on column hiding; the private content is isolated in this table specifically because RLS is row-level.

### `timeline_items`

Append-mostly private timeline feed for a couple. It aggregates meaningful events without becoming a public feed or chat log.

Fields:

- `id uuid primary key`.
- `couple_id uuid not null references couples(id)`.
- `actor_id uuid null references profiles(id)`: nullable for system-generated couple milestones.
- `item_type text not null`: expected values such as `presence_event`, `ritual_completion`, `memory_capsule_created`, `memory_capsule_opened`, `meetup_updated`.
- `source_table text null`: source table name for traceability.
- `source_id uuid null`: source row id for traceability.
- `title text null`: short display title.
- `body text null`: short safe summary, never locked capsule content.
- `emotional_tone text null`: optional tone.
- `metadata jsonb not null default '{}'`: small display metadata only; do not place private locked content here.
- `occurred_at timestamptz not null`: product event time.
- `created_at timestamptz not null`.

Constraints:

- `actor_id`, when present, must be an active member of `couple_id`.
- Timeline rows are private to active couple members.
- Append-mostly: updates should be rare and limited to correction or source lifecycle changes.
- Locked capsule timeline rows must contain metadata only.

### `media_assets`

Metadata for files stored in Supabase Storage.

Fields:

- `id uuid primary key`.
- `couple_id uuid not null references couples(id)`.
- `uploaded_by uuid not null references profiles(id)`.
- `storage_bucket text not null`: expected MVP bucket `couple-media`.
- `storage_path text not null`: private path in Supabase Storage.
- `media_type text not null`: expected values `image`, `audio`, `video`.
- `mime_type text not null`.
- `size_bytes bigint not null`.
- `width integer null`: image/video width when known.
- `height integer null`: image/video height when known.
- `duration_seconds integer null`: audio/video duration when known.
- `status text not null default 'active'`: expected values `active`, `deleted`.
- `created_at timestamptz not null`.
- `updated_at timestamptz not null`.

Constraints:

- `uploaded_by` must be an active member of `couple_id`.
- Unique `(storage_bucket, storage_path)`.
- `size_bytes` must be positive.
- `media_type` must be one of the allowed values.
- Client/server upload flow should strip or avoid storing EXIF GPS metadata.
- Storage objects remain private; access should be mediated by active membership and the parent capsule's open state where relevant.

### `push_tokens`

Device push token registry for future notifications. This creates the architecture now; actual notification delivery comes later.

Fields:

- `id uuid primary key`.
- `user_id uuid not null references profiles(id)`.
- `platform text not null`: expected values `ios`, `android`, `web`.
- `token text not null`: provider token, treated as sensitive operational data.
- `device_id text null`: app-generated installation id if available.
- `app_version text null`.
- `enabled boolean not null default true`.
- `registered_at timestamptz not null`.
- `revoked_at timestamptz null`.
- `created_at timestamptz not null`.
- `updated_at timestamptz not null`.

Constraints:

- Unique `token`.
- `user_id` can only manage their own tokens.
- `revoked_at` should be present when `enabled = false` because of revocation.
- Do not use this table for user activity tracking, last-seen, or presence.

### `notification_preferences`

Per-user preferences by notification type. Actual delivery orchestration is deferred.

Fields:

- `id uuid primary key`.
- `user_id uuid not null references profiles(id)`.
- `notification_type text not null`: expected values `presence`, `ritual`, `capsule`, `invite`, `timeline`.
- `enabled boolean not null default true`.
- `delivery_style text not null default 'gentle'`: expected values `gentle`, `silent`.
- `paused_until timestamptz null`: optional pause for this notification type.
- `created_at timestamptz not null`.
- `updated_at timestamptz not null`.

Constraints:

- Unique `(user_id, notification_type)`.
- User can only read/update their own preferences.
- Recipient quiet hours and pauses always win over sender intent.
- No guilt, urgency, or engagement-pressure notification categories.

## 5. Key constraints

- All shared domain rows must be scoped by `couple_id`.
- `couple_members` must have unique `(couple_id, user_id)`.
- MVP one-active-couple rule: partial unique index on `couple_members(user_id)` where `status = 'active'`.
- Maximum two active members per couple must be enforced in Phase 2 with a trigger and/or RPC workflow using `active_couple_member_count`.
- `couple_invites.invite_code` must be unique, high entropy, single use, and time limited.
- `memory_capsules` must not contain private note text, media storage paths, or hidden content.
- `memory_capsule_contents` must require at least one content field: `note` or `media_asset_id`.
- `ritual_completions` must allow only one completion per user per ritual occurrence.
- Partner ritual responses must remain hidden until both partners complete the occurrence; this is an RLS requirement, not a client-only behavior.
- `presence_events.optional_message` max length is 240.
- No schema should include public profile discoverability, followers, full chat threads, read receipts, last-seen, live GPS, latitude, or longitude.

## 6. Key indexes

Recommended first-pass indexes for Phase 2 migrations:

- `profiles(id)`.
- `couples(created_by)`.
- `couples(status)`.
- `couple_members(couple_id)`.
- `couple_members(user_id)`.
- Unique `couple_members(couple_id, user_id)`.
- Partial unique `couple_members(user_id) where status = 'active'`.
- Partial index `couple_members(couple_id) where status = 'active'` for membership checks and active member count.
- `couple_invites(couple_id)`.
- Unique `couple_invites(invite_code)`.
- Partial index `couple_invites(couple_id) where status = 'pending'`.
- `presence_events(couple_id, created_at desc)`.
- `presence_events(sender_id, created_at desc)`.
- Unique `ritual_templates(slug)`.
- `couple_rituals(couple_id, status)`.
- Partial unique `couple_rituals(couple_id, ritual_template_id) where status = 'active'`.
- `ritual_completions(couple_ritual_id, occurrence_date)`.
- Unique `ritual_completions(couple_ritual_id, user_id, occurrence_date)`.
- `memory_capsules(couple_id, created_at desc)`.
- `memory_capsules(couple_id, unlock_at) where status = 'locked'`.
- `memory_capsule_contents(capsule_id)`.
- `memory_capsule_contents(couple_id, created_by)`.
- `timeline_items(couple_id, occurred_at desc)`.
- `timeline_items(couple_id, item_type, occurred_at desc)`.
- Unique `media_assets(storage_bucket, storage_path)`.
- `media_assets(couple_id, created_at desc)`.
- Unique `push_tokens(token)`.
- `push_tokens(user_id)`.
- Unique `notification_preferences(user_id, notification_type)`.

## 7. Required Postgres helper functions

These helpers are required for Phase 2 RLS and RPC design, but should not be implemented in this Phase 0 doc.

### `is_active_couple_member`

Purpose:

- Return whether a given user is an active member of a given active couple.

Expected inputs:

- `couple_id uuid`.
- Optional `user_id uuid`, defaulting to `auth.uid()` in implementation.

Expected behavior:

- Checks `couple_members.status = 'active'`.
- Checks `couples.status = 'active'`.
- Returns false for null users.
- Used by RLS policies on shared couple tables.

Implementation caution:

- If implemented as `security definer`, keep it in a private/unexposed schema and lock down `search_path`.

### `is_same_active_couple_member`

Purpose:

- Return whether two users are active members of the same active couple.

Expected inputs:

- `user_id_a uuid`.
- `user_id_b uuid`.
- Optional `couple_id uuid` when the caller already knows the couple context.

Expected behavior:

- Returns true only when both users have active membership in the same active couple.
- Supports RLS for partner-scoped reads such as limited profile visibility.
- Must respect the MVP one-active-couple rule.

### `active_couple_member_count`

Purpose:

- Return the count of active members for a couple.

Expected inputs:

- `couple_id uuid`.

Expected behavior:

- Counts rows in `couple_members` where `status = 'active'`.
- Used by invite acceptance and triggers to reject a third active member.
- Must be called inside the same transaction as membership changes in RPC workflows to avoid races.

## 8. Required RPC workflows

These workflows should be implemented in Phase 2 or Phase 3 as transactional database functions or server-side RPCs. They are described here only.

### `create_couple_with_invite`

Purpose:

- Create a new couple for the authenticated user and generate the invite needed for the second partner.

Expected behavior:

- Verify the authenticated user has no active couple.
- Create `couples` with `created_by = auth.uid()`.
- Create active `couple_members` row for the creator.
- Create default `couple_settings`.
- Create a pending `couple_invites` row with a high-entropy invite code and expiry.
- Return the couple id and the one-time invite code.

Careful with:

- Transactionality: do not leave a couple without its creator membership.
- Race protection around one active couple per user.
- Invite code secrecy and entropy.

### `accept_couple_invite`

Purpose:

- Let the invited second partner join an existing couple.

Expected behavior:

- Validate invite exists, is pending, and is not expired.
- Verify the authenticated user has no active couple.
- Verify the couple has fewer than two active members using locked/transactional logic.
- Create active `couple_members` row for the accepting user.
- Mark invite `accepted` with `accepted_by` and `accepted_at`.
- Optionally create a safe timeline item such as `partner_joined`.

Careful with:

- Race protection so two acceptances cannot create three active members.
- Preventing the invite creator from accepting their own invite as a second member.
- Handling expired/revoked invites without leaking private couple details.

### `open_memory_capsule`

Purpose:

- Mark a memory capsule open and allow active couple members to read its private content.

Expected behavior:

- Verify the authenticated user is an active member of the capsule's couple.
- Verify unlock rules are satisfied:
  - `unlock_type = 'immediate'`, or
  - `unlock_type = 'scheduled'` and `unlock_at <= now()`.
- Mark `memory_capsules.status = 'open'`.
- Set `opened_by` and `opened_at`.
- Create a timeline item that says the capsule opened without duplicating private content.

Careful with:

- RLS should allow `memory_capsule_contents` reads after the capsule is open.
- Do not expose locked content through timeline metadata, logs, errors, or notification payloads.
- Opening should be idempotent if the capsule is already open.

## 9. Storage bucket model

Use Supabase Storage for capsule media and related assets.

Recommended MVP bucket:

- `couple-media`: private bucket for all couple-owned media.

Recommended storage path pattern:

- `couples/{couple_id}/capsules/{capsule_id}/{media_asset_id}/{filename}` for capsule content.
- Future non-capsule media can use `couples/{couple_id}/{feature}/{media_asset_id}/{filename}`.

Storage rules:

- Buckets must be private, never public.
- Every object must have a corresponding `media_assets` row.
- Storage policies should use `media_assets` plus active couple membership to authorize access.
- For capsule media, access should also respect the parent capsule's open state through `memory_capsule_contents` and `memory_capsules`.
- Object filenames and paths should be opaque or sanitized so locked capsule content is not revealed before open.
- Signed URLs, if used, should be short lived.
- Uploads should avoid or strip exact GPS/EXIF metadata before storage.
- Deleting or revoking content should update `media_assets.status` and remove or quarantine the Storage object according to the future deletion policy.

## 10. Future schema considerations

- Relationship ending and unpairing policy: define what happens to shared data, exports, capsules, and timeline when one partner leaves.
- Account deletion and export: add data lifecycle workflows that are humane and privacy-preserving.
- Notification delivery queue: later add notification events/deliveries when Phase 12 implements actual push orchestration.
- Parallel moments: add dedicated tables when Phase 8 defines the exact invite/join model.
- Multiple couple spaces: possible post-MVP, but it requires replacing the partial unique one-active-couple rule.
- Invite hardening: consider storing only invite code hashes before migrations are written.
- Audit logging: consider minimal security audit logs for sensitive actions, without turning them into activity surveillance.
- Richer memory capsule unlock rules: future unlock by reunion, anniversary, or mutual action should preserve the content split.
- Analytics: defer until the core flow is stable and privacy constraints are explicit.
- Storage cleanup jobs: add lifecycle handling for orphaned uploads after the media flow exists.

## 11. What not to add yet

- No public profile table or public profile fields.
- No follower, following, contact graph, discovery, or search-user system.
- No full chat tables, message threads, typing indicators, or generic inbox.
- No read receipts.
- No last-seen or ambient online status.
- No exact location columns, coordinates, location history, or live GPS sharing.
- No guilt streak counters or punishment mechanics for missed rituals.
- No monetization tables, subscriptions, entitlements, RevenueCat, or paywalls.
- No AI analysis tables for private memories, capsules, signals, or timeline content.
- No broad analytics/event tracking tables before privacy and product value are proven.
