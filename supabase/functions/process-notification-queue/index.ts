import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { corsPreflight, jsonResponse } from "../_shared/cors.ts";
import {
  buildSafeExpoMessage,
  isRetryableExpoError,
  sendExpoPushMessages,
} from "../_shared/expoPush.ts";
import type { ExpoPushMessage } from "../_shared/expoPush.ts";
import { getSafeNotificationCopy } from "../_shared/notificationCopy.ts";
import {
  createSupabaseAdminClient,
  getCronSecret,
  isAuthorizedServiceRequest,
} from "../_shared/supabaseAdmin.ts";

// Intended schedule (deferred infra setup):
// - process-notification-queue: every 1 minute

const DEFAULT_BATCH_SIZE = 50;
const MAX_BATCH_SIZE = 100;
const MAX_FAILURE_MESSAGE_LENGTH = 500;
const PROCESSING_STALE_AFTER_MINUTES = 10;

type QueueStatus = "pending" | "processing" | "sent" | "failed" | "skipped";

interface NotificationQueueRow {
  id: string;
  recipient_user_id: string;
  couple_id: string | null;
  type: string;
  title: string;
  body: string;
  data: unknown;
  attempts: number;
  max_attempts: number;
}

interface NotificationPreferencesRow {
  presence_enabled: boolean;
  rituals_enabled: boolean;
  capsules_enabled: boolean;
  countdown_enabled: boolean;
}

interface PushTokenRow {
  id: string;
  token: string;
}

interface FailureInfo {
  code: string;
  message: string;
}

interface ProcessSummary {
  fetched: number;
  claimed: number;
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  retried: number;
  skipped_no_tokens: number;
  skipped_preference_blocked: number;
  stale_processing_reset: number;
  tokens_revoked: number;
  claim_conflicts: number;
  deliveries_created: number;
  tickets_ok: number;
  tickets_error: number;
  handler_errors: number;
}

function parseBatchSize(request: Request): number {
  const url = new URL(request.url);
  const rawLimit = url.searchParams.get("limit") ?? url.searchParams.get("batch_size");

  if (!rawLimit) {
    return DEFAULT_BATCH_SIZE;
  }

  const parsed = Number.parseInt(rawLimit, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.min(parsed, MAX_BATCH_SIZE);
}

function truncateFailureMessage(message: string): string {
  if (message.length <= MAX_FAILURE_MESSAGE_LENGTH) {
    return message;
  }
  return `${message.slice(0, MAX_FAILURE_MESSAGE_LENGTH - 3)}...`;
}

function allowsNotificationType(
  notificationType: string,
  preferences: NotificationPreferencesRow | null,
): boolean {
  if (!preferences) {
    return false;
  }

  switch (notificationType) {
    case "presence_pulse":
      return preferences.presence_enabled;
    case "ritual_ready":
    case "ritual_reminder":
      return preferences.rituals_enabled;
    case "capsule_unlocked":
      return preferences.capsules_enabled;
    case "countdown_reminder":
      return preferences.countdown_enabled;
    default:
      return false;
  }
}

async function claimNotification(
  supabase: SupabaseClient,
  queueId: string,
): Promise<NotificationQueueRow | null> {
  const { data, error } = await supabase
    .from("notification_queue")
    .update({ status: "processing" satisfies QueueStatus })
    .eq("id", queueId)
    .eq("status", "pending")
    .select("id,recipient_user_id,couple_id,type,title,body,data,attempts,max_attempts")
    .maybeSingle<NotificationQueueRow>();

  if (error) {
    throw new Error(`Failed to claim queue row ${queueId}: ${error.message}`);
  }

  return data;
}

async function loadNotificationPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationPreferencesRow | null> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("presence_enabled,rituals_enabled,capsules_enabled,countdown_enabled")
    .eq("user_id", userId)
    .maybeSingle<NotificationPreferencesRow>();

  if (error) {
    throw new Error(`Failed to load notification preferences for ${userId}: ${error.message}`);
  }

  return data;
}

async function loadActiveExpoTokens(
  supabase: SupabaseClient,
  userId: string,
): Promise<PushTokenRow[]> {
  const { data, error } = await supabase
    .from("push_tokens")
    .select("id,token")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("token_type", "expo");

  if (error) {
    throw new Error(`Failed to load push tokens for ${userId}: ${error.message}`);
  }

  return data ?? [];
}

async function resetStaleProcessingNotifications(supabase: SupabaseClient): Promise<number> {
  const staleBeforeIso = new Date(
    Date.now() - PROCESSING_STALE_AFTER_MINUTES * 60 * 1000,
  ).toISOString();

  const { data: staleRows, error: selectError } = await supabase
    .from("notification_queue")
    .select("id,attempts,max_attempts")
    .eq("status", "processing")
    .lt("updated_at", staleBeforeIso);

  if (selectError) {
    throw new Error(`Failed to load stale processing notifications: ${selectError.message}`);
  }

  let resetCount = 0;
  for (const row of staleRows ?? []) {
    const shouldRetry = row.attempts < row.max_attempts;
    const { error: updateError } = await supabase
      .from("notification_queue")
      .update({
        status: (shouldRetry ? "pending" : "failed") satisfies QueueStatus,
        failure_code: "processing_timeout",
        failure_message: shouldRetry
          ? "Queue row was returned to pending after a worker timeout."
          : "Queue row failed after a worker timeout.",
      })
      .eq("id", row.id)
      .eq("status", "processing");

    if (updateError) {
      throw new Error(`Failed to reset stale notification ${row.id}: ${updateError.message}`);
    }

    resetCount += 1;
  }

  return resetCount;
}

async function revokePushToken(supabase: SupabaseClient, pushTokenId: string): Promise<void> {
  const revokedAtIso = new Date().toISOString();
  const { error } = await supabase
    .from("push_tokens")
    .update({
      status: "revoked",
      revoked_at: revokedAtIso,
    })
    .eq("id", pushTokenId);

  if (error) {
    throw new Error(`Failed to revoke push token ${pushTokenId}: ${error.message}`);
  }
}

async function updateQueueRow(
  supabase: SupabaseClient,
  queueRow: NotificationQueueRow,
  outcome: {
    status: QueueStatus;
    failure: FailureInfo | null;
  },
): Promise<void> {
  const nowIso = new Date().toISOString();
  const nextAttempts = queueRow.attempts + 1;

  const payload = {
    status: outcome.status,
    attempts: nextAttempts,
    last_attempt_at: nowIso,
    sent_at: outcome.status === "sent" ? nowIso : null,
    skipped_at: outcome.status === "skipped" ? nowIso : null,
    failure_code: outcome.failure?.code ?? null,
    failure_message: outcome.failure ? truncateFailureMessage(outcome.failure.message) : null,
  };

  const { error } = await supabase
    .from("notification_queue")
    .update(payload)
    .eq("id", queueRow.id);

  if (error) {
    throw new Error(`Failed to update queue row ${queueRow.id}: ${error.message}`);
  }
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
  const summary: ProcessSummary = {
    fetched: 0,
    claimed: 0,
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    retried: 0,
    skipped_no_tokens: 0,
    skipped_preference_blocked: 0,
    stale_processing_reset: 0,
    tokens_revoked: 0,
    claim_conflicts: 0,
    deliveries_created: 0,
    tickets_ok: 0,
    tickets_error: 0,
    handler_errors: 0,
  };

  let supabase: SupabaseClient;
  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supabase client init failed";
    return jsonResponse({ ok: false, error: message }, { status: 500 });
  }

  const nowIso = new Date().toISOString();
  try {
    summary.stale_processing_reset = await resetStaleProcessingNotifications(supabase);
  } catch (error) {
    summary.handler_errors += 1;
    const message = error instanceof Error ? error.message : "Failed stale queue recovery";
    return jsonResponse({ ok: false, error: message, summary }, { status: 500 });
  }

  const { data: candidates, error: queueError } = await supabase
    .from("notification_queue")
    .select("id,recipient_user_id,couple_id,type,title,body,data,attempts,max_attempts")
    .eq("status", "pending")
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .limit(batchSize * 2);

  if (queueError) {
    return jsonResponse(
      {
        ok: false,
        error: `Failed to load pending notifications: ${queueError.message}`,
      },
      { status: 500 },
    );
  }

  const typedCandidates = (candidates ?? []) as NotificationQueueRow[];
  const queueRows = typedCandidates
    .filter((row) => row.attempts < row.max_attempts)
    .slice(0, batchSize);

  summary.fetched = queueRows.length;

  for (const queueCandidate of queueRows) {
    let queueRow: NotificationQueueRow | null = null;

    try {
      queueRow = await claimNotification(supabase, queueCandidate.id);
      if (!queueRow) {
        summary.claim_conflicts += 1;
        continue;
      }

      summary.claimed += 1;

      const preferences = await loadNotificationPreferences(supabase, queueRow.recipient_user_id);
      if (!allowsNotificationType(queueRow.type, preferences)) {
        await updateQueueRow(supabase, queueRow, {
          status: "skipped",
          failure: {
            code: "preference_blocked",
            message: "Recipient notification preferences currently block this notification type.",
          },
        });

        summary.processed += 1;
        summary.skipped += 1;
        summary.skipped_preference_blocked += 1;
        continue;
      }

      const pushTokens = await loadActiveExpoTokens(supabase, queueRow.recipient_user_id);
      if (pushTokens.length === 0) {
        await updateQueueRow(supabase, queueRow, {
          status: "skipped",
          failure: {
            code: "no_active_tokens",
            message: "Recipient has no active Expo push tokens.",
          },
        });

        summary.processed += 1;
        summary.skipped += 1;
        summary.skipped_no_tokens += 1;
        continue;
      }

      const safeCopy = getSafeNotificationCopy(queueRow.type, queueRow.title, queueRow.body);
      const expoMessages: ExpoPushMessage[] = [];
      const expoMessageTokenIds: string[] = [];
      const deliveryRows: Record<string, unknown>[] = [];
      const failures: FailureInfo[] = [];
      let hasRetryableFailure = false;

      for (const token of pushTokens) {
        const message = buildSafeExpoMessage({
          to: token.token,
          notificationType: queueRow.type,
          title: safeCopy.title,
          body: safeCopy.body,
          data: queueRow.data,
        });

        if (!message) {
          deliveryRows.push({
            notification_id: queueRow.id,
            push_token_id: token.id,
            ticket_status: "error",
            ticket_message: "Invalid Expo push token format.",
            ticket_details: { error: "InvalidPushToken" },
          });
          failures.push({
            code: "invalid_push_token",
            message: "One or more active Expo tokens had an invalid format.",
          });
          continue;
        }

        expoMessages.push(message);
        expoMessageTokenIds.push(token.id);
      }

      let ticketsOk = 0;
      let ticketsError = 0;

      if (expoMessages.length > 0) {
        const sendResult = await sendExpoPushMessages(expoMessages, {
          expoAccessToken: Deno.env.get("EXPO_ACCESS_TOKEN") ?? undefined,
        });

        for (let index = 0; index < sendResult.items.length; index += 1) {
          const item = sendResult.items[index];
          const pushTokenId = expoMessageTokenIds[index];

          if (!pushTokenId) {
            continue;
          }

          deliveryRows.push({
            notification_id: queueRow.id,
            push_token_id: pushTokenId,
            expo_ticket_id: item.ticket.id ?? null,
            ticket_status: item.ticket.status,
            ticket_message: item.ticket.message ?? null,
            ticket_details: item.ticket.details ?? null,
          });

          if (item.ticket.status === "ok" && item.ticket.id) {
            ticketsOk += 1;
            continue;
          }

          ticketsError += 1;
          hasRetryableFailure = hasRetryableFailure || item.retryable;
          if (item.ticket.details?.error === "DeviceNotRegistered") {
            await revokePushToken(supabase, pushTokenId);
            summary.tokens_revoked += 1;
          }
          failures.push({
            code:
              typeof item.ticket.details?.error === "string"
                ? item.ticket.details.error
                : "expo_ticket_error",
            message: item.ticket.message ?? "Expo returned an error ticket.",
          });
        }

        if (sendResult.requestErrors.length > 0) {
          hasRetryableFailure = true;
          failures.push({
            code: "expo_send_request_error",
            message: sendResult.requestErrors.join("; "),
          });
        }
      } else {
        failures.push({
          code: "no_valid_expo_tokens",
          message: "No valid Expo tokens were available after local validation.",
        });
      }

      if (deliveryRows.length > 0) {
        const { error: deliveryInsertError } = await supabase
          .from("notification_deliveries")
          .insert(deliveryRows);

        if (deliveryInsertError) {
          throw new Error(
            `Failed to insert delivery rows for notification ${queueRow.id}: ${deliveryInsertError.message}`,
          );
        }
      }

      summary.deliveries_created += deliveryRows.length;
      summary.tickets_ok += ticketsOk;
      summary.tickets_error += ticketsError;

      if (ticketsOk > 0) {
        await updateQueueRow(supabase, queueRow, {
          status: "sent",
          failure: null,
        });
        summary.processed += 1;
        summary.sent += 1;
        continue;
      }

      const nextAttempts = queueRow.attempts + 1;
      const firstFailure = failures[0] ?? {
        code: "send_failed",
        message: "Notification send failed without an Expo ticket acceptance.",
      };
      const shouldFail = !hasRetryableFailure || nextAttempts >= queueRow.max_attempts;

      await updateQueueRow(supabase, queueRow, {
        status: shouldFail ? "failed" : "pending",
        failure: firstFailure,
      });

      summary.processed += 1;
      if (shouldFail) {
        summary.failed += 1;
      } else {
        summary.retried += 1;
      }
    } catch (error) {
      summary.handler_errors += 1;

      if (queueRow) {
        const nextAttempts = queueRow.attempts + 1;
        const failureMessage =
          error instanceof Error ? error.message : "Unknown processing error";
        const retryableByDefault = isRetryableExpoError(
          { error: "QueueProcessorError" },
          failureMessage,
        );
        const shouldFail = !retryableByDefault || nextAttempts >= queueRow.max_attempts;

        try {
          await updateQueueRow(supabase, queueRow, {
            status: shouldFail ? "failed" : "pending",
            failure: {
              code: "queue_processor_error",
              message: failureMessage,
            },
          });

          summary.processed += 1;
          if (shouldFail) {
            summary.failed += 1;
          } else {
            summary.retried += 1;
          }
        } catch {
          // Swallow secondary update errors so one broken row does not abort the full batch.
        }
      }
    }
  }

  return jsonResponse({
    ok: true,
    summary,
  });
});
