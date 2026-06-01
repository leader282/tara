import { z } from "zod";

import {
  NOTIFICATION_PERMISSION_STATES,
  NOTIFICATION_TYPES,
} from "@/features/notifications/constants";

const optionalTrimmedStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

const optionalBooleanSchema = z.union([z.boolean(), z.undefined()]);

export const userIdSchema = z.string().uuid("A valid user id is required.");
export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export const notificationPermissionStateSchema = z.enum(NOTIFICATION_PERMISSION_STATES);

export const registerPushTokenInputSchema = z.object({
  token: z
    .string()
    .trim()
    .min(16, "Push token appears invalid.")
    .max(4096, "Push token appears invalid."),
  platform: z.enum(["ios", "android"]),
  tokenType: z.enum(["expo", "native"]).default("expo"),
  nativeToken: optionalTrimmedStringSchema,
  deviceId: optionalTrimmedStringSchema,
  projectId: optionalTrimmedStringSchema,
  appVersion: optionalTrimmedStringSchema,
});

export const unregisterPushTokenSchema = z
  .string()
  .trim()
  .min(1, "Push token is required.");

export const pushTokenRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  token: z.string().min(1),
  platform: z.enum(["ios", "android"]),
  token_type: z.enum(["expo", "native"]),
  native_token: z.string().nullable(),
  device_id: z.string().nullable(),
  project_id: z.string().nullable(),
  app_version: z.string().nullable(),
  status: z.enum(["active", "inactive", "revoked"]),
  last_seen_at: z.string().min(1),
  revoked_at: z.string().nullable(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

export const notificationPreferencesSchema = z.object({
  user_id: z.string().uuid(),
  presence_enabled: z.boolean(),
  rituals_enabled: z.boolean(),
  capsules_enabled: z.boolean(),
  countdown_enabled: z.boolean(),
  quiet_hours_enabled: z.boolean(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

export const upsertNotificationPreferencesInputSchema = z.object({
  userId: userIdSchema,
  presenceEnabled: optionalBooleanSchema,
  ritualsEnabled: optionalBooleanSchema,
  capsulesEnabled: optionalBooleanSchema,
  countdownEnabled: optionalBooleanSchema,
  quietHoursEnabled: optionalBooleanSchema,
});

export const notificationTapPayloadSchema = z
  .object({
    type: z.string().trim().min(1),
    capsule_id: z.string().uuid().optional(),
    capsuleId: z.string().uuid().optional(),
    couple_ritual_id: z.string().uuid().optional(),
    presence_event_id: z.string().uuid().optional(),
  })
  .strict();
