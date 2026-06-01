import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { corsPreflight, jsonResponse } from "../_shared/cors.ts";
import {
  createSupabaseAdminClient,
  getCronSecret,
  isAuthorizedServiceRequest,
} from "../_shared/supabaseAdmin.ts";

const DEFAULT_BATCH_SIZE = 10;
const MAX_BATCH_SIZE = 25;
const MAX_FAILURE_MESSAGE_LENGTH = 500;
const DRY_RUN_NOTE = "Dry run enabled: no destructive deletion actions were executed.";

type AccountDeletionStatus = "pending" | "processing" | "completed" | "canceled" | "failed";

interface AccountDeletionRequestRow {
  id: string;
  user_id: string | null;
  status: AccountDeletionStatus;
  scheduled_for: string;
}

interface ProcessSummary {
  fetched: number;
  claimed: number;
  processed: number;
  completed: number;
  failed: number;
  dryRun: boolean;
}

interface DryRunPlan {
  requestId: string;
  operations: string[];
}

function parseBatchSize(request: Request): number {
  const url = new URL(request.url);
  const raw = url.searchParams.get("limit") ?? url.searchParams.get("batch_size");

  if (!raw) {
    return DEFAULT_BATCH_SIZE;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.min(parsed, MAX_BATCH_SIZE);
}

function parseBoolean(rawValue: string | null | undefined, fallback: boolean): boolean {
  if (!rawValue) {
    return fallback;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function resolveDryRun(request: Request): boolean {
  const url = new URL(request.url);
  const requestOverride = url.searchParams.get("dry_run") ?? url.searchParams.get("dryRun");
  if (requestOverride !== null) {
    return parseBoolean(requestOverride, true);
  }

  return parseBoolean(Deno.env.get("ACCOUNT_DELETION_DRY_RUN"), true);
}

function truncateFailureMessage(message: string): string {
  if (message.length <= MAX_FAILURE_MESSAGE_LENGTH) {
    return message;
  }

  return `${message.slice(0, MAX_FAILURE_MESSAGE_LENGTH - 3)}...`;
}

function safeErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Account deletion processor failed.";
  }

  const normalized = error.message.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "Account deletion processor failed.";
  }

  return truncateFailureMessage(normalized);
}

async function fetchDuePendingRequests(
  supabase: SupabaseClient,
  batchSize: number,
): Promise<AccountDeletionRequestRow[]> {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("account_deletion_requests")
    .select("id,user_id,status,scheduled_for")
    .eq("status", "pending")
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .limit(batchSize * 2);

  if (error) {
    throw new Error(`Failed to load due account deletion requests: ${error.message}`);
  }

  return (data ?? []) as AccountDeletionRequestRow[];
}

async function claimDeletionRequest(
  supabase: SupabaseClient,
  requestId: string,
): Promise<AccountDeletionRequestRow | null> {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("account_deletion_requests")
    .update({
      status: "processing" satisfies AccountDeletionStatus,
      processing_started_at: nowIso,
      failed_at: null,
      failure_message: null,
    })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("id,user_id,status,scheduled_for")
    .maybeSingle<AccountDeletionRequestRow>();

  if (error) {
    throw new Error(`Failed to claim deletion request ${requestId}: ${error.message}`);
  }

  return data;
}

async function markRequestPendingForDryRun(
  supabase: SupabaseClient,
  requestId: string,
): Promise<void> {
  const { error } = await supabase
    .from("account_deletion_requests")
    .update({
      status: "pending" satisfies AccountDeletionStatus,
      processing_started_at: null,
      failed_at: null,
      failure_message: DRY_RUN_NOTE,
    })
    .eq("id", requestId)
    .eq("status", "processing");

  if (error) {
    throw new Error(`Failed to reset dry-run request ${requestId}: ${error.message}`);
  }
}

async function markRequestFailed(
  supabase: SupabaseClient,
  requestId: string,
  failureMessage: string,
): Promise<void> {
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from("account_deletion_requests")
    .update({
      status: "failed" satisfies AccountDeletionStatus,
      failed_at: nowIso,
      failure_message: truncateFailureMessage(failureMessage),
    })
    .eq("id", requestId);

  if (error) {
    throw new Error(`Failed to mark request ${requestId} as failed: ${error.message}`);
  }
}

async function markRequestCompletedById(
  supabase: SupabaseClient,
  requestId: string,
): Promise<void> {
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from("account_deletion_requests")
    .update({
      status: "completed" satisfies AccountDeletionStatus,
      completed_at: nowIso,
      failed_at: null,
      failure_message: null,
    })
    .eq("id", requestId);

  if (error) {
    throw new Error(`Failed to mark request ${requestId} as completed: ${error.message}`);
  }
}

async function deactivatePushTokensForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from("push_tokens")
    .update({
      status: "revoked",
      revoked_at: nowIso,
      updated_at: nowIso,
    })
    .eq("user_id", userId)
    .neq("status", "revoked");

  if (error) {
    throw new Error(`Failed to revoke push tokens: ${error.message}`);
  }
}

async function archiveActiveCoupleForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: memberships, error: membershipsError } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (membershipsError) {
    throw new Error(`Failed to load active memberships: ${membershipsError.message}`);
  }

  const candidateCoupleIds = Array.from(
    new Set((memberships ?? []).map((row) => row.couple_id).filter(Boolean)),
  );

  if (candidateCoupleIds.length === 0) {
    return null;
  }

  const { data: activeCouples, error: activeCouplesError } = await supabase
    .from("couples")
    .select("id")
    .in("id", candidateCoupleIds)
    .eq("status", "active");

  if (activeCouplesError) {
    throw new Error(`Failed to load active couples: ${activeCouplesError.message}`);
  }

  const activeCoupleIds = (activeCouples ?? []).map((row) => row.id);

  if (activeCoupleIds.length === 0) {
    return null;
  }

  if (activeCoupleIds.length > 1) {
    throw new Error("User belongs to multiple active couples.");
  }

  const coupleId = activeCoupleIds[0];

  const { error: revokeInvitesError } = await supabase
    .from("couple_invites")
    .update({ status: "revoked" })
    .eq("couple_id", coupleId)
    .eq("status", "active");

  if (revokeInvitesError) {
    throw new Error(`Failed to revoke active couple invites: ${revokeInvitesError.message}`);
  }

  const { error: archiveCoupleError } = await supabase
    .from("couples")
    .update({ status: "archived" })
    .eq("id", coupleId)
    .eq("status", "active");

  if (archiveCoupleError) {
    throw new Error(`Failed to archive active couple: ${archiveCoupleError.message}`);
  }

  const { error: markMembersLeftError } = await supabase
    .from("couple_members")
    .update({ status: "left" })
    .eq("couple_id", coupleId)
    .eq("status", "active");

  if (markMembersLeftError) {
    throw new Error(`Failed to mark active members left: ${markMembersLeftError.message}`);
  }

  return coupleId;
}

async function findFallbackOwnerForCouple(
  supabase: SupabaseClient,
  coupleId: string,
  deletingUserId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("couple_members")
    .select("user_id")
    .eq("couple_id", coupleId)
    .neq("user_id", deletingUserId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ user_id: string }>();

  if (error) {
    throw new Error(`Failed to find fallback owner for couple ${coupleId}: ${error.message}`);
  }

  return data?.user_id ?? null;
}

async function deleteOrphanCreatedCouple(
  supabase: SupabaseClient,
  coupleId: string,
  deletingUserId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("couples")
    .delete()
    .eq("id", coupleId)
    .eq("created_by", deletingUserId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(`Failed to delete orphan couple ${coupleId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      `Cannot safely delete orphan couple ${coupleId}. Manual review required.`,
    );
  }
}

async function prepareReferencesBeforeAuthDeletion(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error: clearAcceptedByError } = await supabase
    .from("couple_invites")
    .update({ accepted_by: null })
    .eq("accepted_by", userId);

  if (clearAcceptedByError) {
    throw new Error(`Failed to clear invite accepted_by references: ${clearAcceptedByError.message}`);
  }

  const { error: clearOpenedByError } = await supabase
    .from("memory_capsules")
    .update({ opened_by: null })
    .eq("opened_by", userId);

  if (clearOpenedByError) {
    throw new Error(`Failed to clear memory capsule opened_by references: ${clearOpenedByError.message}`);
  }

  const { data: createdCouples, error: createdCouplesError } = await supabase
    .from("couples")
    .select("id")
    .eq("created_by", userId);

  if (createdCouplesError) {
    throw new Error(`Failed to load couples created by user: ${createdCouplesError.message}`);
  }

  const createdCoupleIds = new Set((createdCouples ?? []).map((row) => row.id));

  const { data: createdInvites, error: createdInvitesError } = await supabase
    .from("couple_invites")
    .select("couple_id")
    .eq("created_by", userId);

  if (createdInvitesError) {
    throw new Error(`Failed to load invites created by user: ${createdInvitesError.message}`);
  }

  const affectedCoupleIds = Array.from(
    new Set([
      ...(createdCouples ?? []).map((row) => row.id),
      ...(createdInvites ?? []).map((row) => row.couple_id),
    ]),
  );

  for (const coupleId of affectedCoupleIds) {
    const fallbackOwnerUserId = await findFallbackOwnerForCouple(supabase, coupleId, userId);
    if (!fallbackOwnerUserId) {
      if (createdCoupleIds.has(coupleId)) {
        await deleteOrphanCreatedCouple(supabase, coupleId, userId);
        continue;
      }

      throw new Error(
        `Cannot safely reassign created_by references for couple ${coupleId}. Manual review required.`,
      );
    }

    const { error: reassignCoupleError } = await supabase
      .from("couples")
      .update({ created_by: fallbackOwnerUserId })
      .eq("id", coupleId)
      .eq("created_by", userId);

    if (reassignCoupleError) {
      throw new Error(`Failed to reassign couples.created_by: ${reassignCoupleError.message}`);
    }

    const { error: reassignInvitesError } = await supabase
      .from("couple_invites")
      .update({ created_by: fallbackOwnerUserId })
      .eq("couple_id", coupleId)
      .eq("created_by", userId);

    if (reassignInvitesError) {
      throw new Error(`Failed to reassign invite created_by references: ${reassignInvitesError.message}`);
    }
  }
}

async function deleteAuthUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(`Auth user deletion failed: ${error.message}`);
  }
}

function buildDryRunPlan(requestId: string): DryRunPlan {
  return {
    requestId,
    operations: [
      "mark_request_processing",
      "revoke_push_tokens",
      "archive_active_couple_and_mark_members_left",
      "prepare_foreign_key_references_for_auth_deletion",
      "delete_auth_user",
      "mark_request_completed_by_id",
    ],
  };
}

Deno.serve(async (request) => {
  const preflightResponse = corsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { ok: false, error: "Method not allowed. Use POST." },
      { status: 405 },
    );
  }

  let cronSecret: string;
  try {
    cronSecret = getCronSecret();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Missing function secret";
    return jsonResponse({ ok: false, error: message }, { status: 500 });
  }

  if (!isAuthorizedServiceRequest(request, cronSecret)) {
    return jsonResponse({ ok: false, error: "Unauthorized request." }, { status: 401 });
  }

  const batchSize = parseBatchSize(request);
  const dryRun = resolveDryRun(request);

  let supabase: SupabaseClient;
  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supabase client init failed";
    return jsonResponse({ ok: false, error: message }, { status: 500 });
  }

  const summary: ProcessSummary = {
    fetched: 0,
    claimed: 0,
    processed: 0,
    completed: 0,
    failed: 0,
    dryRun,
  };
  const dryRunPlans: DryRunPlan[] = [];

  let dueRequests: AccountDeletionRequestRow[];
  try {
    dueRequests = await fetchDuePendingRequests(supabase, batchSize);
  } catch (error) {
    const message = safeErrorMessage(error);
    return jsonResponse({ ok: false, error: message, summary }, { status: 500 });
  }

  summary.fetched = dueRequests.length;

  for (const candidate of dueRequests.slice(0, batchSize)) {
    let claimedRequest: AccountDeletionRequestRow | null = null;

    try {
      claimedRequest = await claimDeletionRequest(supabase, candidate.id);
      if (!claimedRequest) {
        continue;
      }

      summary.claimed += 1;

      if (!claimedRequest.user_id) {
        throw new Error("Deletion request does not contain a user_id.");
      }

      if (dryRun) {
        dryRunPlans.push(buildDryRunPlan(claimedRequest.id));
        await markRequestPendingForDryRun(supabase, claimedRequest.id);
        summary.processed += 1;
        continue;
      }

      await deactivatePushTokensForUser(supabase, claimedRequest.user_id);
      await archiveActiveCoupleForUser(supabase, claimedRequest.user_id);
      await prepareReferencesBeforeAuthDeletion(supabase, claimedRequest.user_id);
      await deleteAuthUser(supabase, claimedRequest.user_id);
      await markRequestCompletedById(supabase, claimedRequest.id);

      summary.processed += 1;
      summary.completed += 1;
    } catch (error) {
      if (claimedRequest) {
        summary.processed += 1;
        summary.failed += 1;

        const failureMessage = safeErrorMessage(error);
        try {
          await markRequestFailed(supabase, claimedRequest.id, failureMessage);
        } catch {
          // Avoid aborting the full batch if the failure update itself errors.
        }
      } else {
        summary.failed += 1;
      }
    }
  }

  return jsonResponse({
    ok: true,
    summary,
    dryRunPlans: dryRun ? dryRunPlans : undefined,
    note:
      "Scaffold only. Destructive deletion behavior requires dedicated QA in a safe non-production environment.",
  });
});
