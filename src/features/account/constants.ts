export const LEAVE_COUPLE_CONFIRMATION = "UNPAIR";
export const ACCOUNT_DELETION_CONFIRMATION = "DELETE";
export const ACCOUNT_DELETION_REASON_MAX_LENGTH = 500;

export const ACCOUNT_DELETION_REQUEST_STATUSES = [
  "pending",
  "processing",
  "completed",
  "canceled",
  "failed",
] as const;

export const DATA_EXPORT_REQUEST_STATUSES = [
  "requested",
  "processing",
  "completed",
  "failed",
  "canceled",
] as const;
