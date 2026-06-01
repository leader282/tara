import type { Tables } from "@/lib/supabase/database.types";

import type {
  ACCOUNT_DELETION_CONFIRMATION,
  ACCOUNT_DELETION_REQUEST_STATUSES,
  DATA_EXPORT_REQUEST_STATUSES,
  LEAVE_COUPLE_CONFIRMATION,
} from "@/features/account/constants";

export type AccountDeletionRequest = Tables<"account_deletion_requests">;
export type DataExportRequest = Tables<"data_export_requests">;

export type AccountDeletionRequestStatus =
  (typeof ACCOUNT_DELETION_REQUEST_STATUSES)[number];
export type DataExportRequestStatus = (typeof DATA_EXPORT_REQUEST_STATUSES)[number];

export type LeaveCurrentCoupleConfirmation = typeof LEAVE_COUPLE_CONFIRMATION;
export type RequestAccountDeletionConfirmation = typeof ACCOUNT_DELETION_CONFIRMATION;

export type LeaveCurrentCoupleResult = {
  coupleId: string;
  archived: boolean;
};

export type RequestAccountDeletionInput = {
  confirmation: string;
  reason?: string | null;
};
