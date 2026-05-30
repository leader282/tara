import { z } from "zod";

import { profileSetupSchema } from "@/features/onboarding/schemas";
import {
  EMOTIONAL_TONES,
  LOVE_SIGNALS,
  NOTIFICATION_TONES,
} from "@/features/onboarding/types";

const POSTGRES_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

function emptyStringToNull(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

const optionalNullableToneSchema = z.preprocess(
  emptyStringToNull,
  z.enum(EMOTIONAL_TONES).optional().nullable()
);

const optionalNullableNotificationToneSchema = z.preprocess(
  emptyStringToNull,
  z.enum(NOTIFICATION_TONES).optional().nullable()
);

const optionalNullableTimeSchema = z.preprocess(
  emptyStringToNull,
  z
    .string()
    .trim()
    .regex(POSTGRES_TIME_PATTERN, "Quiet hours must use HH:mm or HH:mm:ss.")
    .optional()
    .nullable()
);

export const upsertCurrentProfileSchema = profileSetupSchema.extend({
  userId: z.string().uuid("A valid user id is required."),
});

export const upsertCurrentUserSettingsSchema = z.object({
  userId: z.string().uuid("A valid user id is required."),
  emotionalTone: optionalNullableToneSchema,
  preferredLoveSignals: z
    .array(z.enum(LOVE_SIGNALS))
    .min(1, "Choose at least one love signal.")
    .max(LOVE_SIGNALS.length, "Too many love signals selected.")
    .refine(
      (value) => new Set(value).size === value.length,
      "Love signals must be unique."
    )
    .optional(),
  notificationTone: optionalNullableNotificationToneSchema,
  quietHoursStart: optionalNullableTimeSchema,
  quietHoursEnd: optionalNullableTimeSchema,
});
