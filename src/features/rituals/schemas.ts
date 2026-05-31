import { z } from "zod";

import {
  normalizeRitualCategory,
  normalizeRitualInputType,
} from "@/features/rituals/constants";
import { formatUtcDateOnly } from "@/lib/dates/format";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnlyValue(value: string): boolean {
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

  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
}

const uuidSchema = z.string().uuid("A valid ritual id is required.");
const optionalTrimmedStringSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return null;
    }

    return value.length > 0 ? value : null;
  });

export const ritualDaySchema = z
  .string()
  .trim()
  .regex(DATE_ONLY_PATTERN, "Ritual day must use YYYY-MM-DD format.")
  .refine((value) => isValidDateOnlyValue(value), {
    message: "Ritual day must be a valid calendar date.",
  });

export function toCanonicalRitualDay(scheduledFor?: string | null): string {
  if (!scheduledFor) {
    return formatUtcDateOnly(new Date());
  }

  return ritualDaySchema.parse(scheduledFor);
}

export const completeRitualSchema = z.object({
  coupleRitualId: uuidSchema,
  textResponse: optionalTrimmedStringSchema.refine(
    (value) => value === null || value.length <= 1000,
    {
      message: "Keep your response under 1000 characters.",
    }
  ),
  mediaAssetId: z
    .string()
    .uuid("A valid media asset id is required.")
    .nullable()
    .optional()
    .transform((value) => value ?? null),
});

export const ritualCoupleIdSchema = z.string().uuid("A valid couple id is required.");
export const ritualCurrentUserIdSchema = z.string().uuid("A valid user id is required.");
export const ritualIdSchema = uuidSchema;

export const ritualHistoryLimitSchema = z
  .number()
  .int("Ritual history limit must be a whole number.")
  .min(1, "Ritual history limit must be at least 1.")
  .max(100, "Ritual history limit must be 100 or fewer.");

export const ritualTemplateRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  category: z.string().transform((value) => normalizeRitualCategory(value)),
  prompt: z.string().min(1),
  input_type: z.string().transform((value) => normalizeRitualInputType(value)),
  is_active: z.boolean(),
  created_at: z.string().min(1),
});

export const coupleRitualRowSchema = z.object({
  id: z.string().uuid(),
  couple_id: z.string().uuid(),
  ritual_template_id: z.string().uuid(),
  scheduled_for: ritualDaySchema,
  status: z.string(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

export const ritualCompletionRowSchema = z.object({
  id: z.string().uuid(),
  couple_ritual_id: z.string().uuid(),
  user_id: z.string().uuid(),
  text_response: z.string().nullable(),
  media_asset_id: z.string().uuid().nullable(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

export const ritualCompletionsSchema = z.array(ritualCompletionRowSchema);

export const coupleRitualWithTemplateRowSchema = coupleRitualRowSchema.extend({
  ritual_template: ritualTemplateRowSchema.nullable(),
});

export const coupleRitualWithTemplateRowsSchema = z.array(coupleRitualWithTemplateRowSchema);

export const ensureDailyRitualResultRowSchema = z.object({
  couple_ritual_id: z.string().uuid(),
});

export const completeRitualResultRowSchema = z.object({
  couple_ritual_id: z.string().uuid(),
  status: z.string(),
  is_revealed: z.boolean(),
  completed_count: z.number().int().min(0),
});
