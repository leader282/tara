import { z } from "zod";

import {
  ACCOUNT_DELETION_CONFIRMATION,
  ACCOUNT_DELETION_REASON_MAX_LENGTH,
  ACCOUNT_DELETION_REQUEST_STATUSES,
  DATA_EXPORT_REQUEST_STATUSES,
  LEAVE_COUPLE_CONFIRMATION,
} from "@/features/account/constants";

function normalizeOptionalReason(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const accountUserIdSchema = z.string().uuid("A valid user id is required.");
export const accountDeletionRequestIdSchema = z
  .string()
  .uuid("A valid account deletion request id is required.");

export const leaveCurrentCoupleConfirmationSchema = z
  .string()
  .trim()
  .refine((value) => value === LEAVE_COUPLE_CONFIRMATION, {
    message: "Confirmation must be UNPAIR.",
  });

export const requestAccountDeletionInputSchema = z.object({
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === ACCOUNT_DELETION_CONFIRMATION, {
      message: "Confirmation must be DELETE.",
    }),
  reason: z
    .preprocess(normalizeOptionalReason, z.string().max(ACCOUNT_DELETION_REASON_MAX_LENGTH).nullable())
    .optional(),
});

export const leaveCurrentCoupleResultSchema = z.object({
  couple_id: z.string().uuid(),
  archived: z.boolean(),
});

export const accountDeletionRequestSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  status: z.enum(ACCOUNT_DELETION_REQUEST_STATUSES),
  reason: z.string().nullable(),
  requested_at: z.string().min(1),
  scheduled_for: z.string().min(1),
  processing_started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  canceled_at: z.string().nullable(),
  failed_at: z.string().nullable(),
  failure_message: z.string().nullable(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

export const dataExportRequestSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  status: z.enum(DATA_EXPORT_REQUEST_STATUSES),
  requested_at: z.string().min(1),
  completed_at: z.string().nullable(),
  failed_at: z.string().nullable(),
  failure_message: z.string().nullable(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});
