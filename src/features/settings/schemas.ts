import { z } from "zod";

import {
  SETTINGS_COUPLE_THEME_OPTIONS,
  SETTINGS_EMOTIONAL_TONES,
  SETTINGS_LOVE_SIGNALS,
  SETTINGS_NOTIFICATION_TONES,
  SETTINGS_RITUAL_FREQUENCIES,
} from "@/features/settings/constants";
import { isValidTimeZone } from "@/lib/dates/timezone";

const IANA_TIMEZONE_PATTERN = /^[A-Za-z_]+(?:\/[A-Za-z0-9_\-+]+)+$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalStringPreserveUndefined(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  return normalizeOptionalString(value);
}

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
    now.getUTCDate(),
  );

  return parsedDate.getTime() <= todayUtcMidnight;
}

const optionalNullableShortTextSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => normalizeOptionalStringPreserveUndefined(value))
  .refine((value) => value === null || value === undefined || value.length <= 120, {
    message: "Must be 120 characters or fewer.",
  });

const optionalNullableBirthdaySchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => normalizeOptionalStringPreserveUndefined(value))
  .refine((value) => value === null || value === undefined || DATE_ONLY_PATTERN.test(value), {
    message: "Birthday must use YYYY-MM-DD format.",
  })
  .refine((value) => value === null || value === undefined || isValidDateOnly(value), {
    message: "Birthday must be a valid calendar date.",
  })
  .refine((value) => value === null || value === undefined || isNotFutureDate(value), {
    message: "Birthday cannot be in the future.",
  });

const optionalNullableEmotionalToneSchema = z
  .union([z.enum(SETTINGS_EMOTIONAL_TONES), z.null(), z.undefined()])
  .transform((value) => value);

const optionalNullableNotificationToneSchema = z
  .union([z.enum(SETTINGS_NOTIFICATION_TONES), z.null(), z.undefined()])
  .transform((value) => value);

const optionalLoveSignalsSchema = z
  .array(z.enum(SETTINGS_LOVE_SIGNALS))
  .max(SETTINGS_LOVE_SIGNALS.length, "Too many love signals selected.")
  .refine((value) => new Set(value).size === value.length, {
    message: "Love signals must be unique.",
  })
  .optional();

const optionalQuietHourSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => normalizeOptionalStringPreserveUndefined(value))
  .refine((value) => value === null || value === undefined || HH_MM_PATTERN.test(value), {
    message: "Quiet hours must use HH:mm format.",
  });

const optionalNullableAnniversarySchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => normalizeOptionalStringPreserveUndefined(value))
  .refine((value) => value === null || value === undefined || DATE_ONLY_PATTERN.test(value), {
    message: "Anniversary date must use YYYY-MM-DD format.",
  })
  .refine((value) => value === null || value === undefined || isValidDateOnly(value), {
    message: "Anniversary date must be a valid calendar date.",
  });

const optionalNullableThemeSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => normalizeOptionalStringPreserveUndefined(value))
  .refine((value) => value === null || value === undefined || value.length <= 40, {
    message: "Theme must be 40 characters or fewer.",
  })
  .refine(
    (value) =>
      value === null ||
      value === undefined ||
      SETTINGS_COUPLE_THEME_OPTIONS.length === 0 ||
      SETTINGS_COUPLE_THEME_OPTIONS.includes(value),
    {
      message: "Theme is not supported.",
    },
  );

export const settingsUserIdSchema = z.string().uuid("A valid user id is required.");
export const settingsCoupleIdSchema = z.string().uuid("A valid couple id is required.");

export const updateSettingsProfileSchema = z.object({
  userId: settingsUserIdSchema,
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
    .refine((value) => isValidTimeZone(value) || IANA_TIMEZONE_PATTERN.test(value), {
      message: "Timezone must be a valid IANA timezone.",
    }),
  city: optionalNullableShortTextSchema,
  country: optionalNullableShortTextSchema,
  birthday: optionalNullableBirthdaySchema,
  emotionalTone: optionalNullableEmotionalToneSchema,
  preferredLoveSignals: optionalLoveSignalsSchema,
  notificationTone: optionalNullableNotificationToneSchema,
});

export const settingsProfileFormSchema = updateSettingsProfileSchema.pick({
  displayName: true,
  timezone: true,
  city: true,
  country: true,
  birthday: true,
});

export type SettingsProfileFormInput = z.infer<typeof settingsProfileFormSchema>;

export const updateQuietHoursSchema = z
  .object({
    userId: settingsUserIdSchema,
    quietHoursEnabled: z.boolean(),
    quietHoursStart: optionalQuietHourSchema,
    quietHoursEnd: optionalQuietHourSchema,
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

export const quietHoursSettingsFormSchema = updateQuietHoursSchema.pick({
  quietHoursEnabled: true,
  quietHoursStart: true,
  quietHoursEnd: true,
});

export type QuietHoursSettingsFormInput = z.infer<typeof quietHoursSettingsFormSchema>;

export const updateCoupleSharedSettingsSchema = z.object({
  anniversaryDate: optionalNullableAnniversarySchema,
  ritualFrequency: z.union([z.enum(SETTINGS_RITUAL_FREQUENCIES), z.null(), z.undefined()]),
  theme: optionalNullableThemeSchema,
});

export const emotionalSettingsFormSchema = z.object({
  emotionalTone: z.enum(SETTINGS_EMOTIONAL_TONES),
  preferredLoveSignals: z
    .array(z.enum(SETTINGS_LOVE_SIGNALS))
    .min(1, "Choose at least one love signal.")
    .max(SETTINGS_LOVE_SIGNALS.length, "Too many love signals selected.")
    .refine((value) => new Set(value).size === value.length, {
      message: "Love signals must be unique.",
    }),
  notificationTone: z.enum(SETTINGS_NOTIFICATION_TONES).nullable(),
});

export type EmotionalSettingsFormInput = z.infer<typeof emotionalSettingsFormSchema>;

export const coupleSettingsFormSchema = updateCoupleSharedSettingsSchema.extend({
  ritualFrequency: z.enum(SETTINGS_RITUAL_FREQUENCIES),
  theme: z.string().trim().nullable().optional(),
});

export type CoupleSettingsFormInput = z.infer<typeof coupleSettingsFormSchema>;
