# Tara Technical Debt Register (Phase 15C)

Status: Draft  
Scope: Documentation and planning only

## 1. Purpose

This register tracks known technical debt in Tara after MVP hardening and before post-MVP feature expansion.  
It exists to ensure privacy, reliability, and calm user experience are not compromised by roadmap velocity.

Use this document to:

- prioritize cleanup before new feature phases,
- keep debt tradeoffs explicit and reviewable,
- link debt decisions to product risk and release confidence.

## 2. Severity scale

| Severity | Meaning | Typical examples |
| --- | --- | --- |
| `S0` | Release/privacy blocker | cross-couple data exposure risk, unsafe deletion behavior |
| `S1` | High risk to trust/reliability | critical worker instability, missing security verification |
| `S2` | Moderate quality/developer drag | duplication, inconsistent conventions, missing coverage |
| `S3` | Low-priority maintainability cleanup | refactors with limited user-facing impact |

## 3. Debt categories

- RLS/test coverage
- Edge Function scheduling
- Notification receipt processing
- Account deletion processor verification
- Media cleanup after failed upload
- Signed URL expiry/refetch behavior
- Route guard duplication
- Query key consistency
- Giant components/files
- Repeated date/time helpers
- Error mapping duplication
- Accessibility gaps
- Real-device QA gaps
- EAS/CI gaps
- Docs gaps

## 4. Known issues

| ID | Category | Severity | Signal | Risk if ignored | Recommended action |
| --- | --- | --- | --- | --- | --- |
| `TD-001` | RLS/test coverage | S0 | SQL RLS tests exist but do not fully cover every sensitive flow end-to-end | privacy regressions slip through | expand SQL test matrix for timeline, invite edge cases, storage read gates |
| `TD-002` | Edge Function scheduling | S1 | Worker files mention intended schedules as deferred setup | notification and deletion jobs may silently stall | formalize schedules, retries, and runbook |
| `TD-003` | Notification receipt processing | S1 | Receipt checker exists but monitoring/escalation standards are not codified | dead tokens and delivery blind spots | add alert thresholds and receipt-failure playbook |
| `TD-004` | Account deletion processor verification | S0 | Deletion worker explicitly states scaffold/destructive verification pending | compliance and trust risk | complete controlled destructive-mode validation with documented acceptance criteria |
| `TD-005` | Media cleanup after failed upload | S1 | Upload flows exist; orphan and failed object lifecycle is not fully formalized | storage bloat, residual sensitive data | define scheduled cleanup and reconciliation path |
| `TD-006` | Signed URL expiry/refetch behavior | S1 | Signed URL use is present; expiry/refetch UX edge cases are under-tested | broken media UX and inconsistent access control behavior | define uniform refetch policy and error UX |
| `TD-007` | Route guard duplication | S2 | Guard logic repeated across root and group layouts | inconsistent gate behavior during changes | centralize guard decision logic |
| `TD-008` | Query key consistency | S2 | Query key usage is distributed and convention drift is likely | stale/inconsistent cache invalidation | enforce query-key naming and invalidation checklist |
| `TD-009` | Giant components/files | S2 | Some workers/screens are large and multi-responsibility | higher regression rate and review complexity | split by domain responsibilities |
| `TD-010` | Repeated date/time helpers | S2 | date/time logic spread across modules | timezone bugs and duplicated fixes | consolidate shared date-time utilities |
| `TD-011` | Error mapping duplication | S2 | many feature-specific error mapping files | inconsistent error tone and maintenance overhead | define shared error taxonomy and message policy |
| `TD-012` | Accessibility gaps | S1 | manual accessibility checks exist, automation coverage limited | regressions in inclusive UX | add accessibility checklist gates and screen-level audits |
| `TD-013` | Real-device QA gaps | S1 | no mobile E2E automation; manual critical path testing required | release confidence depends on manual throughput | stabilize device matrix process and add smoke automation later |
| `TD-014` | EAS/CI gaps | S1 | CI/build guardrails and release metadata checks are partial | build/release drift and late failure discovery | harden CI checks and build preflight requirements |
| `TD-015` | Docs gaps | S2 | architecture/baseline docs can lag implementation reality | wrong assumptions in future planning | add periodic doc sync checkpoint per phase |

## 5. Privacy/security debt

Priority privacy/security debt themes:

1. Complete deletion worker verification in controlled non-production conditions.
2. Strengthen RLS regression tests for reveal gates (ritual responses, locked capsule content, media access).
3. Ensure notification payload and logging sanitization remains consistent across all message types.
4. Formalize signed URL handling standards (TTL, refresh, lock-state checks, fallback behavior).
5. Document and test media orphan cleanup as part of data minimization and lifecycle hygiene.

## 6. Testing debt

- Limited automated coverage for integrated flows spanning app + Supabase functions + RLS.
- No robust automated regression suite for push queue/receipt lifecycle.
- Manual QA remains the primary safety net for cross-device and cross-timezone behavior.
- Limited explicit tests for cache invalidation consistency and signed URL refresh edges.

## 7. Performance debt

- Notification queue batch and retry tuning is not yet backed by production-like load characterization.
- Receipt polling and token revocation behavior need threshold tuning as scale grows.
- Media-heavy surfaces may regress without standardized thumbnail/loading strategies.
- Some large files combine orchestration and business logic, making performance tuning harder.

## 8. Developer experience debt

- Duplicated route guard patterns increase change risk.
- Query key conventions are not enforced by a strict project-wide contract.
- Error mapping is fragmented, risking inconsistent user messaging.
- Date/time logic is repeated across features with potential timezone inconsistency.
- Several modules are larger than ideal for rapid review and low-risk iteration.

## 9. Operational debt

- Worker schedules and failure handling are not fully codified as operational runbooks.
- Alerting expectations for stuck queue rows, receipt failures, and deletion flow failures are not fully documented.
- Release flow still relies heavily on manual checklist discipline.
- Internal distribution hardening exists, but CI release guardrails can be tightened.

## 10. Recommended cleanup before Phase 16

Minimum recommended cleanup set before starting implementation of Phase 16:

1. **Deletion processor verification (`S0`)**  
   Validate destructive flow end-to-end in a safe environment and publish pass/fail evidence.
2. **Worker scheduling and runbook (`S1`)**  
   Document cron cadence, retry expectations, and incident response for notification/deletion workers.
3. **RLS test expansion (`S0/S1`)**  
   Add missing SQL test scenarios for sensitive reveal and outsider access edge cases.
4. **Signed URL policy (`S1`)**  
   Define and standardize expiry/refetch behavior and failure UX.
5. **Media orphan cleanup plan (`S1`)**  
   Document cleanup ownership, schedule, and recovery behavior.
6. **Route guard consolidation plan (`S2`)**  
   Prepare central guard decision approach before new route-heavy features.
7. **Query key audit (`S2`)**  
   Audit key naming and invalidation rules to reduce cache regressions.
8. **Accessibility baseline pass (`S1`)**  
   Perform high-impact screen audit and define required checks for new features.

## 11. Deferred cleanup

Can be deferred until after early post-MVP phases if release health remains stable:

- Large-file modularization not directly tied to active roadmap work.
- Full E2E mobile automation rollout (start with smoke automation later).
- Deep consolidation of all error mapping files (after a shared error policy is accepted).
- Full date/time helper consolidation (after immediate timezone-sensitive issues are addressed).
- Broader CI modernization beyond immediate release-safety and privacy gates.

## 12. Decision log

| Date | Decision | Reason | Revisit trigger |
| --- | --- | --- | --- |
| 2026-06-09 | Treat deletion processor verification as S0 | User trust and policy compliance risk | Verification evidence completed and reviewed |
| 2026-06-09 | Require RLS and signed URL cleanup before significant feature expansion | Prevent privacy regressions while roadmap accelerates | RLS matrix and signed URL standards are stable |
| 2026-06-09 | Keep route/query key/DX refactors as controlled S2 unless blocking active work | Preserve focus on high-risk trust work first | If regressions indicate architecture friction is rising |
| 2026-06-09 | Keep long-horizon automation and broad refactors deferred | Avoid slowing Phase 16 start unnecessarily | If manual QA throughput becomes release bottleneck |
