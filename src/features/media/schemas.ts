import { z } from "zod";

import {
  MEDIA_ALLOWED_MIME_TYPES,
  MEDIA_PURPOSES,
  MEDIA_UPLOAD_PROGRESS_STEPS,
  MEDIA_UPLOAD_STATUSES,
} from "@/features/media/constants";

const positiveIntegerSchema = z.number().int().positive();
const nullablePositiveIntegerSchema = z
  .union([positiveIntegerSchema, z.null()])
  .optional()
  .transform((value) => value ?? null);

export const mediaMimeTypeSchema = z.enum(MEDIA_ALLOWED_MIME_TYPES);
export const mediaPurposeSchema = z.enum(MEDIA_PURPOSES);
export const mediaUploadStatusSchema = z.enum(MEDIA_UPLOAD_STATUSES);
export const mediaUploadProgressStepSchema = z.enum(MEDIA_UPLOAD_PROGRESS_STEPS);

export const mediaAssetSchema = z.object({
  id: z.string().uuid(),
  couple_id: z.string().uuid(),
  owner_id: z.string().uuid(),
  storage_path: z.string().min(1),
  media_type: z.literal("image"),
  mime_type: mediaMimeTypeSchema,
  size_bytes: nullablePositiveIntegerSchema,
  width: nullablePositiveIntegerSchema,
  height: nullablePositiveIntegerSchema,
  purpose: mediaPurposeSchema,
  upload_status: mediaUploadStatusSchema,
  uploaded_at: z.string().min(1).nullable(),
  created_at: z.string().min(1),
});

export const reservedMediaAssetSchema = z.object({
  id: z.string().uuid(),
  couple_id: z.string().uuid(),
  owner_id: z.string().uuid(),
  storage_path: z.string().min(1),
  media_type: z.literal("image"),
  mime_type: mediaMimeTypeSchema,
  size_bytes: nullablePositiveIntegerSchema,
  width: nullablePositiveIntegerSchema,
  height: nullablePositiveIntegerSchema,
  purpose: mediaPurposeSchema,
  upload_status: mediaUploadStatusSchema,
});

export const uploadMediaInputSchema = z.object({
  localUri: z.string().trim().min(1, "A local image path is required."),
  mimeType: mediaMimeTypeSchema.nullable().optional(),
  width: positiveIntegerSchema.optional(),
  height: positiveIntegerSchema.optional(),
  purpose: mediaPurposeSchema,
});

export const reserveMediaAssetInputSchema = z.object({
  mimeType: mediaMimeTypeSchema,
  sizeBytes: nullablePositiveIntegerSchema,
  width: positiveIntegerSchema.optional(),
  height: positiveIntegerSchema.optional(),
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

export const pickedImageSchema = z.object({
  uri: z.string().trim().min(1),
  width: positiveIntegerSchema,
  height: positiveIntegerSchema,
  mimeType: mediaMimeTypeSchema.nullable(),
  fileSize: nullablePositiveIntegerSchema,
  fileName: z
    .union([z.string().trim().min(1), z.null()])
    .optional()
    .transform((value) => value ?? null),
});

export const markMediaAssetFailedResultSchema = z.object({
  id: z.string().uuid(),
  upload_status: mediaUploadStatusSchema,
});

export const reserveMediaAssetRowsSchema = z.array(reservedMediaAssetSchema);
export const markMediaAssetUploadedRowsSchema = z.array(mediaAssetSchema);
export const markMediaAssetFailedRowsSchema = z.array(markMediaAssetFailedResultSchema);
