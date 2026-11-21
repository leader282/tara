import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { corsPreflight, jsonResponse } from "../_shared/cors.ts";
import {
  createSupabaseAdminClient,
  getCronSecret,
  isAuthorizedServiceRequest,
} from "../_shared/supabaseAdmin.ts";

// Scheduled daily by the prune-couple-history cron job.

const MEDIA_BUCKET = "couple-media";
const CLEANUP_BATCH_SIZE = 100;
const MAX_CLEANUP_BATCHES = 20;

interface PruneRow {
  deleted_rituals: number;
  deleted_timeline_items: number;
  deleted_media: number;
  queued_files: number;
}

interface PruneSummary extends PruneRow {
  removed_files: number;
  failed_files: number;
}

async function removeQueuedFiles(supabase: SupabaseClient, summary: PruneSummary): Promise<void> {
  for (let batch = 0; batch < MAX_CLEANUP_BATCHES; batch += 1) {
    const { data, error } = await supabase.rpc("claim_storage_cleanup_batch", {
      p_limit: CLEANUP_BATCH_SIZE,
    });
    if (error) {
      throw new Error(`Failed to claim queued files: ${error.message}`);
    }

    const paths = ((data ?? []) as Array<{ storage_path: string }>).map((row) => row.storage_path);
    if (paths.length === 0) {
      return;
    }

    // Paths that no longer exist (an upload that never finished) are skipped without an error,
    // so a successful call means every claimed path is gone.
    const { error: removeError } = await supabase.storage.from(MEDIA_BUCKET).remove(paths);
    if (removeError) {
      summary.failed_files += paths.length;
      return;
    }

    const { error: completeError } = await supabase.rpc("complete_storage_cleanup", {
      p_storage_paths: paths,
    });
    if (completeError) {
      throw new Error(`Failed to clear removed files from the queue: ${completeError.message}`);
    }

    summary.removed_files += paths.length;
  }
}

Deno.serve(async (request) => {
  const preflightResponse = corsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed. Use POST." }, { status: 405 });
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

  const { data, error } = await supabase.rpc("prune_couple_history");
  if (error) {
    return jsonResponse(
      { ok: false, error: `Failed to prune history: ${error.message}` },
      { status: 500 },
    );
  }

  const pruned = ((data ?? []) as PruneRow[])[0];
  const summary: PruneSummary = {
    deleted_rituals: pruned?.deleted_rituals ?? 0,
    deleted_timeline_items: pruned?.deleted_timeline_items ?? 0,
    deleted_media: pruned?.deleted_media ?? 0,
    queued_files: pruned?.queued_files ?? 0,
    removed_files: 0,
    failed_files: 0,
  };

  try {
    await removeQueuedFiles(supabase, summary);
  } catch (cleanupError) {
    const message = cleanupError instanceof Error ? cleanupError.message : "File cleanup failed";
    return jsonResponse({ ok: false, error: message, summary }, { status: 500 });
  }

  return jsonResponse({ ok: true, summary });
});
