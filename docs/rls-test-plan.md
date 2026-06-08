# Tara RLS Test Plan (Phase 14F)

This plan covers local validation of Supabase RLS/privacy behavior for Tara.

## Test file to privacy-risk mapping

- `supabase/tests/rls_profiles.test.sql`
  - Risk covered: accidental public profile directory or non-partner profile reads.
- `supabase/tests/rls_couples.test.sql`
  - Risk covered: invite abuse, third-member insertion, cross-couple access, and unsafe unpair behavior.
- `supabase/tests/rls_rituals.test.sql`
  - Risk covered: unrevealed ritual response leakage and ritual completion access by non-members/waiting users.
- `supabase/tests/rls_capsules.test.sql`
  - Risk covered: locked capsule content leakage and invalid early open behavior.
- `supabase/tests/rls_media.test.sql`
  - Risk covered: context-aware media access (owner/partner/outsider, ritual reveal, capsule unlock).
- `supabase/tests/rls_notifications.test.sql`
  - Risk covered: push token privacy, notification preference isolation, and queue table lock-down from client roles.
- `supabase/tests/rls_account_safety.test.sql`
  - Risk covered: account deletion/data export request isolation and unauthorized cancellation/leave operations.

## Local-only test commands

Run these against local Supabase only:

```bash
# 1) Start local Supabase services
npm run supabase:start

# 2) Ensure local schema and policies are reset/applied
npm run supabase:reset

# 3) Run full pgTAP suite locally
npx supabase test db --local supabase/tests

# 4) Optional: run a single focused test file
npx supabase test db --local supabase/tests/rls_capsules.test.sql

# 5) Stop local services when done
npm run supabase:stop
```

Guidance:

- Do not run `--linked` for Phase 14F QA validation.
- Use `--local` explicitly for deterministic test behavior.

## Manual SQL checks for known gaps

Automated tests currently focus on major privacy gates but do not fully cover every table/path. Run these checks manually in local SQL if needed.

### 1) Presence and timeline outsider denial

Verify an outsider cannot read another couple's `presence_events` or `timeline_items`.

```sql
set local role authenticated;
select set_config('request.jwt.claim.sub', '<outsider-user-uuid>', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select count(*) from public.presence_events where couple_id = '<target-couple-uuid>';
select count(*) from public.timeline_items where couple_id = '<target-couple-uuid>';
```

Expected: `0` rows visible.

### 2) Capsule metadata vs content boundary

Verify partner can see capsule metadata but not locked content.

```sql
set local role authenticated;
select set_config('request.jwt.claim.sub', '<partner-user-uuid>', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select count(*) from public.memory_capsules where id = '<locked-capsule-uuid>';
select count(*) from public.memory_capsule_contents where capsule_id = '<locked-capsule-uuid>';
```

Expected: metadata visible, contents hidden until open.

### 3) Notification worker table isolation

Verify `notification_queue` remains blocked to authenticated client role.

```sql
set local role authenticated;
select set_config('request.jwt.claim.sub', '<user-uuid>', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select count(*) from public.notification_queue;
```

Expected: permission denied error (not readable from client role).

### 4) Storage object policy smoke test (if storage policies changed)

Verify guessed object paths do not grant outsider reads from `couple-media`.

- Attempt signed URL creation/read as outsider for known object path.
- Expected: denied unless actor is authorized by couple membership and context gate.

### 5) Realtime payload privacy spot check

After enabling realtime channels, verify hidden ritual/capsule payload fields are not emitted before reveal/open.

- Trigger partner completion and locked capsule events with two accounts.
- Inspect received realtime payload shape.
- Expected: no hidden `response_text`, no locked capsule private note/media leak.
