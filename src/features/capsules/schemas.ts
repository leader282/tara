import { z } from "zod";

import {
  CAPSULE_MAX_EMOTIONAL_CONTEXT_LENGTH,
  CAPSULE_MAX_NOTE_LENGTH,
  CAPSULE_MAX_TITLE_LENGTH,
  CAPSULE_UNLOCK_TYPES,
} from "@/features/capsules/constants";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return false;
  }

  const [yearString, monthString, dayString] = value.split("-");
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  const parsedDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  );
}

const optionalTrimmedStringSchema = z
  .string()
  .trim()
  .nullish()
  .transform((value) => {
    if (value == null) {
      return null;
    }

    return value.length > 0 ? value : null;
  });

const unlockDateSchema = z
  .string()
  .trim()
  .regex(DATE_ONLY_PATTERN, "Unlock date must use YYYY-MM-DD format.")
  .refine((value) => isValidDateOnly(value), {
    message: "Unlock date must be a valid calendar date.",
  });

const unlockTimeSchema = optionalTrimmedStringSchema.refine(
  (value) => value === null || HH_MM_PATTERN.test(value),
  {
    message: "Unlock time must use HH:mm format.",
  }
);

const capsuleNoteSchema = optionalTrimmedStringSchema.refine(
  (value) => value === null || value.length <= CAPSULE_MAX_NOTE_LENGTH,
  {
    message: `Keep the note under ${CAPSULE_MAX_NOTE_LENGTH} characters.`,
  }
);

const mediaAssetIdSchema = z
  .string()
  .uuid("A valid media asset id is required.")
  .nullable()
  .optional()
  .transform((value) => value ?? null);

export const capsuleIdSchema = z.string().uuid("A valid capsule id is required.");
export const capsuleCoupleIdSchema = z.string().uuid("A valid couple id is required.");
export const capsuleCurrentUserIdSchema = z.string().uuid("A valid user id is required.");

export const createCapsuleSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Add a short title for this memory capsule.")
      .max(CAPSULE_MAX_TITLE_LENGTH, `Keep the title under ${CAPSULE_MAX_TITLE_LENGTH} characters.`),
    note: capsuleNoteSchema,
    mediaAssetId: mediaAssetIdSchema,
    unlockDate: unlockDateSchema,
    unlockTime: unlockTimeSchema,
    emotionalContext: optionalTrimmedStringSchema.refine(
      (value) => value === null || value.length <= CAPSULE_MAX_EMOTIONAL_CONTEXT_LENGTH,
      {
        message: `Keep emotional context under ${CAPSULE_MAX_EMOTIONAL_CONTEXT_LENGTH} characters.`,
      }
    ),
  })
  .superRefine((value, context) => {
    if (value.note !== null || value.mediaAssetId !== null) {
      return;
    }

    context.addIssue({
      code: "custom",
      message: "Add a note or private photo before saving this memory capsule.",
      path: ["note"],
    });
  });

export const openCapsuleSchema = z.object({
  capsuleId: capsuleIdSchema,
});

export const memoryCapsuleRowSchema = z.object({
  id: z.string().uuid(),
  couple_id: z.string().uuid(),
  creator_id: z.string().uuid(),
  title: z.string().min(1).max(CAPSULE_MAX_TITLE_LENGTH),
  unlock_type: z.enum(CAPSULE_UNLOCK_TYPES),
  unlock_at: z.string().min(1),
  emotional_context: z.string().max(CAPSULE_MAX_EMOTIONAL_CONTEXT_LENGTH).nullable(),
  opened_by: z.string().uuid().nullable(),
  opened_at: z.string().nullable(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

export const memoryCapsuleRowsSchema = z.array(memoryCapsuleRowSchema);

export const memoryCapsuleContentRowSchema = z.object({
  capsule_id: z.string().uuid(),
  note: z.string().max(CAPSULE_MAX_NOTE_LENGTH).nullable(),
  media_asset_id: z.string().uuid().nullable(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});
