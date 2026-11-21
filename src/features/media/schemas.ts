import { z } from "zod";

import {
  MEDIA_ALLOWED_MIME_TYPES,
  MEDIA_MAX_ITEMS,
  MEDIA_PURPOSES,
  MEDIA_TYPES,
  MEDIA_UPLOAD_STATUSES,
} from "@/features/media/constants";

const positiveIntegerSchema = z.number().int().positive();
const nullablePositiveIntegerSchema = z
  .union([positiveIntegerSchema, z.null()])
  .optional()
  .transform((value) => value ?? null);
const nullableIntegerSchema = z
  .union([z.number().int(), z.null()])
  .optional()
  .transform((value) => value ?? null);
const nullableUuidSchema = z
  .union([z.string().uuid(), z.null()])
  .optional()
  .transform((value) => value ?? null);

export const mediaMimeTypeSchema = z.enum(MEDIA_ALLOWED_MIME_TYPES);
export const mediaTypeSchema = z.enum(MEDIA_TYPES);
export const mediaPurposeSchema = z.enum(MEDIA_PURPOSES);
export const mediaUploadStatusSchema = z.enum(MEDIA_UPLOAD_STATUSES);

export const mediaAssetIdsSchema = z
  .array(z.string().uuid())
  .max(MEDIA_MAX_ITEMS, `You can add up to ${MEDIA_MAX_ITEMS} photos or videos.`)
  .refine((ids) => new Set(ids).size === ids.length, "Each photo or video can only be added once.");

export const mediaAssetSchema = z.object({
  id: z.string().uuid(),
  couple_id: z.string().uuid(),
  owner_id: z.string().uuid(),
  storage_path: z.string().min(1),
  media_type: mediaTypeSchema,
  mime_type: mediaMimeTypeSchema,
  size_bytes: nullablePositiveIntegerSchema,
  width: nullablePositiveIntegerSchema,
  height: nullablePositiveIntegerSchema,
  duration_ms: nullablePositiveIntegerSchema,
  purpose: mediaPurposeSchema,
  upload_status: mediaUploadStatusSchema,
  uploaded_at: z.string().min(1).nullable(),
  created_at: z.string().min(1),
  ritual_completion_id: nullableUuidSchema,
  memory_capsule_id: nullableUuidSchema,
  sort_order: nullableIntegerSchema,
});

export const attachedMediaSchema = z.object({
  id: z.string().uuid(),
  storage_path: z.string().min(1),
  media_type: mediaTypeSchema,
  width: nullablePositiveIntegerSchema,
  height: nullablePositiveIntegerSchema,
  duration_ms: nullablePositiveIntegerSchema,
  sort_order: nullableIntegerSchema,
  ritual_completion_id: nullableUuidSchema,
  memory_capsule_id: nullableUuidSchema,
});

export const attachedMediaRowsSchema = z.array(attachedMediaSchema);

export const reservedMediaAssetSchema = z.object({
  id: z.string().uuid(),
  couple_id: z.string().uuid(),
  owner_id: z.string().uuid(),
  storage_path: z.string().min(1),
  media_type: mediaTypeSchema,
  mime_type: mediaMimeTypeSchema,
  size_bytes: nullablePositiveIntegerSchema,
  width: nullablePositiveIntegerSchema,
  height: nullablePositiveIntegerSchema,
  duration_ms: nullablePositiveIntegerSchema,
  purpose: mediaPurposeSchema,
  upload_status: mediaUploadStatusSchema,
});

export const pickedMediaSchema = z.object({
  uri: z.string().trim().min(1, "A local file path is required."),
  kind: mediaTypeSchema,
  mimeType: mediaMimeTypeSchema,
  width: nullablePositiveIntegerSchema,
  height: nullablePositiveIntegerSchema,
  fileSize: nullablePositiveIntegerSchema,
  durationMs: nullablePositiveIntegerSchema,
});

export const reserveMediaAssetInputSchema = z.object({
  mimeType: mediaMimeTypeSchema,
  sizeBytes: nullablePositiveIntegerSchema,
  width: positiveIntegerSchema.optional(),
  height: positiveIntegerSchema.optional(),
  durationMs: nullablePositiveIntegerSchema,
  purpose: mediaPurposeSchema,
});

export const markMediaAssetUploadedInputSchema = z.object({
  mediaAssetId: z.string().uuid(),
  sizeBytes: positiveIntegerSchema,
  width: positiveIntegerSchema.optional(),
  height: positiveIntegerSchema.optional(),
});

export const markMediaAssetFailedInputSchema = z.object({
  mediaAssetId: z.string().uuid(),
});

export const uploadMediaObjectInputSchema = z.object({
  storagePath: z.string().trim().min(1),
  contentType: mediaMimeTypeSchema,
});

export const uploadMediaFileInputSchema = z.object({
  storagePath: z.string().trim().min(1),
  fileUri: z.string().trim().min(1),
  contentType: mediaMimeTypeSchema,
});

export const signedMediaUrlInputSchema = z.object({
  storagePath: z.string().trim().min(1),
  expiresInSeconds: positiveIntegerSchema.optional(),
});

export const signedMediaUrlSchema = z.object({
  storagePath: z.string().trim().min(1),
  signedUrl: z.string().url(),
  expiresInSeconds: positiveIntegerSchema,
  expiresAt: positiveIntegerSchema,
});

export const markMediaAssetFailedResultSchema = z.object({
  id: z.string().uuid(),
  upload_status: mediaUploadStatusSchema,
});

export const reserveMediaAssetRowsSchema = z.array(reservedMediaAssetSchema);
export const markMediaAssetUploadedRowsSchema = z.array(mediaAssetSchema);
export const markMediaAssetFailedRowsSchema = z.array(markMediaAssetFailedResultSchema);
