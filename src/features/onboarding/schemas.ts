import { z } from "zod";

import {
  EMOTIONAL_TONES,
  LOVE_SIGNALS,
  NOTIFICATION_TONES,
} from "@/features/onboarding/types";
import { isValidTimeZone } from "@/lib/dates/timezone";

const IANA_TIMEZONE_PATTERN = /^[A-Za-z_]+(?:\/[A-Za-z0-9_\-+]+)+$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const QUIET_HOUR_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function isValidDateOnly(value: string): boolean {
  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  return parsedDate.toISOString().slice(0, 10) === value;
}

function isNotFutureDate(value: string): boolean {
  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  const now = new Date();
  const todayUtcMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  return parsedDate.getTime() <= todayUtcMidnight;
}

const optionalShortTextSchema = z
  .string()
  .trim()
  .max(120)
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

const birthdaySchema = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional()
  .refine((value) => value === undefined || DATE_ONLY_PATTERN.test(value), {
    message: "Birthday must use YYYY-MM-DD format.",
  })
  .refine((value) => value === undefined || isValidDateOnly(value), {
    message: "Birthday must be a valid calendar date.",
  })
  .refine((value) => value === undefined || isNotFutureDate(value), {
    message: "Birthday cannot be in the future.",
  });

const quietHourSchema = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional()
  .refine((value) => value === undefined || QUIET_HOUR_PATTERN.test(value), {
    message: "Use HH:mm format.",
  });

export const profileSetupSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(80, "Display name must be 80 characters or fewer."),
  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required.")
    .max(100, "Timezone must be 100 characters or fewer.")
    .refine(
      (value) => isValidTimeZone(value) || IANA_TIMEZONE_PATTERN.test(value),
      "Timezone must be a valid IANA timezone."
    ),
  city: optionalShortTextSchema,
  country: optionalShortTextSchema,
  birthday: birthdaySchema,
});

export const emotionalPreferencesSchema = z.object({
  emotionalTone: z.enum(EMOTIONAL_TONES),
  preferredLoveSignals: z
    .array(z.enum(LOVE_SIGNALS))
    .min(1, "Choose at least one love signal.")
    .max(LOVE_SIGNALS.length, "Too many love signals selected.")
    .refine(
      (value) => new Set(value).size === value.length,
      "Love signals must be unique."
    ),
  notificationTone: z.enum(NOTIFICATION_TONES).optional(),
});

export const quietHoursSchema = z
  .object({
    quietHoursEnabled: z.boolean(),
    quietHoursStart: quietHourSchema,
    quietHoursEnd: quietHourSchema,
  })
  .superRefine((value, context) => {
    if (!value.quietHoursEnabled) {
      return;
    }

    if (!value.quietHoursStart) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quietHoursStart"],
        message: "Start time is required when quiet hours are enabled.",
      });
    }

    if (!value.quietHoursEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quietHoursEnd"],
        message: "End time is required when quiet hours are enabled.",
      });
    }
  });

export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;
export type EmotionalPreferencesInput = z.infer<typeof emotionalPreferencesSchema>;
export type QuietHoursInput = z.infer<typeof quietHoursSchema>;
