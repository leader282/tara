import type { PostgrestError } from "@supabase/supabase-js";

import {
  accountDeletionRequestIdSchema,
  accountDeletionRequestSchema,
  accountUserIdSchema,
  dataExportRequestSchema,
  leaveCurrentCoupleConfirmationSchema,
  leaveCurrentCoupleResultSchema,
  requestAccountDeletionInputSchema,
} from "@/features/account/schemas";
import type {
  AccountDeletionRequest,
  DataExportRequest,
  LeaveCurrentCoupleResult,
  RequestAccountDeletionInput,
} from "@/features/account/types";
import { toAccountActionError } from "@/lib/errors/accountErrorMessages";
import { supabase } from "@/lib/supabase/client";

function throwIfSupabaseError(error: PostgrestError | null): void {
  if (error) {
    throw error;
  }
}

function getFirstRpcRow<T extends Record<string, unknown>>(
  data: T[] | T | null,
): T | null {
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data;
}

export async function leaveCurrentCouple(confirmation: string): Promise<LeaveCurrentCoupleResult> {
  try {
    const parsedConfirmation = leaveCurrentCoupleConfirmationSchema.parse(confirmation);

    const { data, error } = await supabase.rpc("leave_current_couple", {
      p_confirmation: parsedConfirmation,
    });

    throwIfSupabaseError(error);

    const row = getFirstRpcRow(data);
    if (!row) {
      throw new Error("Leave couple request returned no data.");
    }

    const parsedResult = leaveCurrentCoupleResultSchema.parse(row);
    return {
      coupleId: parsedResult.couple_id,
      archived: parsedResult.archived,
    };
  } catch (error) {
    throw toAccountActionError(error);
  }
}

export async function requestAccountDeletion(
  input: RequestAccountDeletionInput,
): Promise<AccountDeletionRequest> {
  try {
    const parsedInput = requestAccountDeletionInputSchema.parse(input);

    const { data, error } = await supabase.rpc("request_account_deletion", {
      p_confirmation: parsedInput.confirmation,
      p_reason: parsedInput.reason ?? undefined,
    });

    throwIfSupabaseError(error);

    const row = getFirstRpcRow(data);
    if (!row) {
      throw new Error("Account deletion request returned no data.");
    }

    return accountDeletionRequestSchema.parse(row);
  } catch (error) {
    throw toAccountActionError(error);
  }
}

export async function cancelAccountDeletionRequest(
  requestId: string,
): Promise<AccountDeletionRequest> {
  try {
    const parsedRequestId = accountDeletionRequestIdSchema.parse(requestId);

    const { data, error } = await supabase.rpc("cancel_account_deletion_request", {
      p_request_id: parsedRequestId,
    });

    throwIfSupabaseError(error);

    const row = getFirstRpcRow(data);
    if (!row) {
      throw new Error("Cancel account deletion request returned no data.");
    }

    return accountDeletionRequestSchema.parse(row);
  } catch (error) {
    throw toAccountActionError(error);
  }
}

export async function getCurrentAccountDeletionRequest(
  userId: string,
): Promise<AccountDeletionRequest | null> {
  try {
    const parsedUserId = accountUserIdSchema.parse(userId);

    const { data, error } = await supabase
      .from("account_deletion_requests")
      .select("*")
      .eq("user_id", parsedUserId)
      .order("created_at", { ascending: false })
      .limit(1);

    throwIfSupabaseError(error);

    const row = data?.[0];
    if (!row) {
      return null;
    }

    return accountDeletionRequestSchema.parse(row);
  } catch (error) {
    throw toAccountActionError(error);
  }
}

export async function requestDataExport(): Promise<DataExportRequest> {
  try {
    const { data, error } = await supabase.rpc("request_data_export");

    throwIfSupabaseError(error);

    const row = getFirstRpcRow(data);
    if (!row) {
      throw new Error("Data export request returned no data.");
    }

    return dataExportRequestSchema.parse(row);
  } catch (error) {
    throw toAccountActionError(error);
  }
}

export async function getCurrentDataExportRequests(
  userId: string,
): Promise<DataExportRequest[]> {
  try {
    const parsedUserId = accountUserIdSchema.parse(userId);

    const { data, error } = await supabase
      .from("data_export_requests")
      .select("*")
      .eq("user_id", parsedUserId)
      .order("created_at", { ascending: false });

    throwIfSupabaseError(error);

    return (data ?? []).map((row) => dataExportRequestSchema.parse(row));
  } catch (error) {
    throw toAccountActionError(error);
  }
}
