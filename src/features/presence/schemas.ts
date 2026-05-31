import { z } from "zod";

import { PRESENCE_PULSE_TYPES } from "@/features/presence/constants";

export const recentPresencePulseCoupleIdSchema = z
  .string()
  .uuid("A valid couple id is required.");

export const recentPresencePulseLimitSchema = z
  .number()
  .int("Pulse limit must be a whole number.")
  .min(1, "Pulse limit must be at least 1.")
  .max(25, "Pulse limit must be 25 or fewer.");

const optionalMessageSchema = z
  .string()
  .trim()
  .max(240, "Keep your note under 240 characters.")
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return null;
    }

    return value.length > 0 ? value : null;
  });

export const sendPresencePulseSchema = z.object({
  type: z.enum(PRESENCE_PULSE_TYPES),
  optionalMessage: optionalMessageSchema,
});

export const presenceEventSchema = z.object({
  id: z.string().uuid(),
  couple_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  type: z.enum(PRESENCE_PULSE_TYPES),
  optional_message: z.string().max(240).nullable(),
  created_at: z.string().min(1),
});

export const presenceEventsSchema = z.array(presenceEventSchema);
