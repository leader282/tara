import { z } from "zod";

import {
  MAX_TIMELINE_PAGE_SIZE,
  TIMELINE_ITEM_TYPES,
} from "@/features/timeline/constants";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const timelineItemTypeSchema = z.enum(TIMELINE_ITEM_TYPES);
export const timelineCoupleIdSchema = z.string().uuid("A valid couple id is required.");
export const timelinePageParamSchema = z
  .number()
  .int("Timeline cursor must be a whole number.")
  .min(0, "Timeline cursor must be zero or greater.");
export const timelinePageSizeSchema = z
  .number()
  .int("Timeline page size must be a whole number.")
  .min(1, "Timeline page size must be at least 1.")
  .max(MAX_TIMELINE_PAGE_SIZE, `Timeline page size must be ${MAX_TIMELINE_PAGE_SIZE} or fewer.`);

export const timelinePayloadObjectSchema = z.object({}).catchall(z.unknown());

export const presenceSentPayloadSchema = z.object({
  presence_event_id: z.string().uuid().optional(),
  pulse_type: z.string().optional(),
  has_optional_message: z.boolean().optional(),
});

export const ritualCompletedPayloadSchema = z.object({
  couple_ritual_id: z.string().uuid().optional(),
  ritual_template_id: z.string().uuid().optional(),
  scheduled_for: z.string().regex(DATE_ONLY_PATTERN, "Expected YYYY-MM-DD format.").optional(),
});

export const capsuleCreatedPayloadSchema = z.object({
  capsule_id: z.string().uuid().optional(),
  unlock_at: z.string().min(1).optional(),
  has_note: z.boolean().optional(),
  has_media: z.boolean().optional(),
});

export const capsuleOpenedPayloadSchema = z.object({
  capsule_id: z.string().uuid().optional(),
  unlock_at: z.string().min(1).optional(),
  opened_at: z.string().min(1).optional(),
});

export const countdownUpdatedPayloadSchema = z.object({
  next_meetup_at: z.string().min(1).optional(),
  next_meetup_location: z.string().max(160).optional(),
  has_location: z.boolean().optional(),
});

export const unknownPayloadSchema = z.object({});
