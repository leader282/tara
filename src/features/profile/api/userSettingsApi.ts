import { z } from "zod";

import { upsertCurrentUserSettingsSchema } from "@/features/profile/schemas";
import type {
  NotificationPreferences,
  UpsertCurrentUserSettingsInput,
  UserSettings,
} from "@/features/profile/types";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { supabase } from "@/lib/supabase/client";

const userIdSchema = z.string().uuid("A valid user id is required.");
const HH_MM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const HH_MM_SS_PATTERN = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function toPostgresTimeString(value: string | null | undefined): string | null {
  const normalizedValue = normalizeOptionalText(value);

  if (!normalizedValue) {
    return null;
  }

  if (HH_MM_SS_PATTERN.test(normalizedValue)) {
    return normalizedValue;
  }

  if (HH_MM_PATTERN.test(normalizedValue)) {
    return `${normalizedValue}:00`;
  }

  throw new Error("Quiet hour values must use HH:mm or HH:mm:ss format.");
}

function throwIfSupabaseError(errorMessage: string | null | undefined): void {
  if (errorMessage) {
    throw new Error(errorMessage);
  }
}

function dedupe(values: readonly string[]): string[] {
  return [...new Set(values)];
}

export async function getCurrentUserSettings(userId: string): Promise<UserSettings | null> {
  const parsedUserId = userIdSchema.parse(userId);

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", parsedUserId)
    .maybeSingle();

  throwIfSupabaseError(error?.message);

  return data;
}

export async function upsertCurrentUserSettings(
  input: UpsertCurrentUserSettingsInput
): Promise<UserSettings> {
  const parsedInput = upsertCurrentUserSettingsSchema.parse(input);

  const payload: TablesInsert<"user_settings"> = {
    user_id: parsedInput.userId,
  };

  if (parsedInput.emotionalTone !== undefined) {
    payload.emotional_tone = normalizeOptionalText(parsedInput.emotionalTone);
  }

  if (parsedInput.preferredLoveSignals !== undefined) {
    payload.preferred_love_signals = dedupe(parsedInput.preferredLoveSignals);
  }

  if (parsedInput.notificationTone !== undefined) {
    payload.notification_tone = normalizeOptionalText(parsedInput.notificationTone);
  }

  if (parsedInput.quietHoursStart !== undefined) {
    payload.quiet_hours_start = toPostgresTimeString(parsedInput.quietHoursStart);
  }

  if (parsedInput.quietHoursEnd !== undefined) {
    payload.quiet_hours_end = toPostgresTimeString(parsedInput.quietHoursEnd);
  }

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  throwIfSupabaseError(error?.message);

  if (!data) {
    throw new Error("User settings upsert returned no data.");
  }

  return data;
}

export async function ensureNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const parsedUserId = userIdSchema.parse(userId);

  const payload: Pick<TablesInsert<"notification_preferences">, "user_id"> = {
    user_id: parsedUserId,
  };

  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  throwIfSupabaseError(error?.message);

  if (!data) {
    throw new Error("Notification preferences upsert returned no data.");
  }

  return data;
}
