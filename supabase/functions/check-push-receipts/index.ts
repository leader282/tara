import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { corsPreflight, jsonResponse } from "../_shared/cors.ts";
import {
  getExpoPushReceipts,
  isDeviceNotRegisteredReceipt,
} from "../_shared/expoPush.ts";
import {
  createSupabaseAdminClient,
  getCronSecret,
  isAuthorizedServiceRequest,
} from "../_shared/supabaseAdmin.ts";

// Intended schedule (deferred infra setup):
// - check-push-receipts: every 15 minutes

const DEFAULT_BATCH_SIZE = 200;
const MAX_BATCH_SIZE = 500;

interface DeliveryRow {
  id: string;
  push_token_id: string;
  expo_ticket_id: string;
  created_at: string;
}

interface ReceiptSummary {
  fetched: number;
  checked: number;
  missing_receipts: number;
  receipt_ok: number;
  receipt_error: number;
  tokens_revoked: number;
  request_errors: number;
  update_errors: number;
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

async function loadDeliveriesForReceiptCheck(
  supabase: SupabaseClient,
  batchSize: number,
): Promise<DeliveryRow[]> {
  const now = Date.now();
  const olderThanIso = new Date(now - 15 * 60 * 1000).toISOString();
  const withinLast24HoursIso = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("notification_deliveries")
    .select("id,push_token_id,expo_ticket_id,created_at")
    .not("expo_ticket_id", "is", null)
    .is("receipt_checked_at", null)
    .lte("created_at", olderThanIso)
    .gte("created_at", withinLast24HoursIso)
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (error) {
    throw new Error(`Failed to load deliveries for receipt checks: ${error.message}`);
  }

  const typedRows = (data ?? []) as Array<{
    id: string;
    push_token_id: string;
    expo_ticket_id: string | null;
    created_at: string;
  }>;

  return typedRows.filter((row): row is DeliveryRow => typeof row.expo_ticket_id === "string");
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

  let supabase: SupabaseClient;
  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supabase client init failed";
    return jsonResponse({ ok: false, error: message }, { status: 500 });
  }

  const batchSize = parseBatchSize(request);
  const summary: ReceiptSummary = {
    fetched: 0,
    checked: 0,
    missing_receipts: 0,
    receipt_ok: 0,
    receipt_error: 0,
    tokens_revoked: 0,
    request_errors: 0,
    update_errors: 0,
  };

  let deliveries: DeliveryRow[];
  try {
    deliveries = await loadDeliveriesForReceiptCheck(supabase, batchSize);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed loading deliveries";
    return jsonResponse({ ok: false, error: message }, { status: 500 });
  }

  summary.fetched = deliveries.length;
  if (deliveries.length === 0) {
    return jsonResponse({ ok: true, summary });
  }

  const ticketIds = deliveries.map((delivery) => delivery.expo_ticket_id);
  const receiptLookup = await getExpoPushReceipts(ticketIds, {
    expoAccessToken: Deno.env.get("EXPO_ACCESS_TOKEN") ?? undefined,
  });
  summary.request_errors = receiptLookup.requestErrors.length;

  const checkedAtIso = new Date().toISOString();
  const tokenIdsToRevoke = new Set<string>();

  for (const delivery of deliveries) {
    const receipt = receiptLookup.receiptsByTicketId[delivery.expo_ticket_id];
    if (!receipt) {
      summary.missing_receipts += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from("notification_deliveries")
      .update({
        receipt_status: receipt.status,
        receipt_message: receipt.message ?? null,
        receipt_details: receipt.details ?? null,
        receipt_checked_at: checkedAtIso,
      })
      .eq("id", delivery.id);

    if (updateError) {
      summary.update_errors += 1;
      continue;
    }

    summary.checked += 1;
    if (receipt.status === "ok") {
      summary.receipt_ok += 1;
    } else {
      summary.receipt_error += 1;
      if (isDeviceNotRegisteredReceipt(receipt)) {
        tokenIdsToRevoke.add(delivery.push_token_id);
      }
    }
  }

  if (tokenIdsToRevoke.size > 0) {
    const revokedAtIso = new Date().toISOString();
    const { error: revokeError } = await supabase
      .from("push_tokens")
      .update({
        status: "revoked",
        revoked_at: revokedAtIso,
      })
      .in("id", Array.from(tokenIdsToRevoke));

    if (revokeError) {
      summary.update_errors += 1;
    } else {
      summary.tokens_revoked = tokenIdsToRevoke.size;
    }
  }

  return jsonResponse({
    ok: true,
    summary,
    request_errors: receiptLookup.requestErrors,
  });
});
