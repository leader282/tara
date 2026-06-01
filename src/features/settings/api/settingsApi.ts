import type { PostgrestError } from "@supabase/supabase-js";

import {
  settingsUserIdSchema,
  updateQuietHoursSchema,
  updateSettingsProfileSchema,
} from "@/features/settings/schemas";
import type {
  SettingsProfile,
  UpdateQuietHoursInput,
  UpdateQuietHoursResult,
  UpdateSettingsProfileInput,
} from "@/features/settings/types";
import { toSettingsActionError } from "@/lib/errors/settingsErrorMessages";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { supabase } from "@/lib/supabase/client";

const HH_MM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const HH_MM_SS_PATTERN = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

function throwIfSupabaseError(error: PostgrestError | null): void {
  if (error) {
    throw error;
  }
}

function dedupe(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function toPostgresTimeString(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    return null;
  }

  if (HH_MM_SS_PATTERN.test(normalized)) {
    return normalized;
  }

  if (HH_MM_PATTERN.test(normalized)) {
    return `${normalized}:00`;
  }

  throw new Error("Quiet hour values must use HH:mm or HH:mm:ss format.");
}

export async function getSettingsProfile(userId: string): Promise<SettingsProfile> {
  try {
    const parsedUserId = settingsUserIdSchema.parse(userId);

    const [profileResult, userSettingsResult, notificationPreferencesResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", parsedUserId).maybeSingle(),
      supabase.from("user_settings").select("*").eq("user_id", parsedUserId).maybeSingle(),
      supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", parsedUserId)
        .maybeSingle(),
    ]);

    throwIfSupabaseError(profileResult.error);
    throwIfSupabaseError(userSettingsResult.error);
    throwIfSupabaseError(notificationPreferencesResult.error);

    return {
      profile: profileResult.data ?? null,
      userSettings: userSettingsResult.data ?? null,
      notificationPreferences: notificationPreferencesResult.data ?? null,
    };
  } catch (error) {
    throw toSettingsActionError(error);
  }
}

export async function updateSettingsProfile(
  input: UpdateSettingsProfileInput,
): Promise<SettingsProfile> {
  try {
    const parsedInput = updateSettingsProfileSchema.parse(input);

    const profilePayload: TablesInsert<"profiles"> = {
      id: parsedInput.userId,
      display_name: parsedInput.displayName,
      timezone: parsedInput.timezone,
      city: parsedInput.city ?? null,
      country: parsedInput.country ?? null,
      birthday: parsedInput.birthday ?? null,
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select("id")
      .single();

    throwIfSupabaseError(profileError);

    const shouldUpdateUserSettings =
      parsedInput.emotionalTone !== undefined ||
      parsedInput.preferredLoveSignals !== undefined ||
      parsedInput.notificationTone !== undefined;

    if (shouldUpdateUserSettings) {
      const userSettingsPayload: TablesInsert<"user_settings"> = {
        user_id: parsedInput.userId,
      };

      if (parsedInput.emotionalTone !== undefined) {
        userSettingsPayload.emotional_tone = parsedInput.emotionalTone;
      }

      if (parsedInput.preferredLoveSignals !== undefined) {
        userSettingsPayload.preferred_love_signals = dedupe(parsedInput.preferredLoveSignals);
      }

      if (parsedInput.notificationTone !== undefined) {
        userSettingsPayload.notification_tone = parsedInput.notificationTone;
      }

      const { error: userSettingsError } = await supabase
        .from("user_settings")
        .upsert(userSettingsPayload, { onConflict: "user_id" })
        .select("user_id")
        .single();

      throwIfSupabaseError(userSettingsError);
    }

    return getSettingsProfile(parsedInput.userId);
  } catch (error) {
    throw toSettingsActionError(error);
  }
}

export async function updateQuietHours(
  input: UpdateQuietHoursInput,
): Promise<UpdateQuietHoursResult> {
  try {
    const parsedInput = updateQuietHoursSchema.parse(input);

    const quietHoursStart = parsedInput.quietHoursEnabled
      ? toPostgresTimeString(parsedInput.quietHoursStart)
      : null;
    const quietHoursEnd = parsedInput.quietHoursEnabled
      ? toPostgresTimeString(parsedInput.quietHoursEnd)
      : null;

    const userSettingsPayload: TablesInsert<"user_settings"> = {
      user_id: parsedInput.userId,
      quiet_hours_start: quietHoursStart,
      quiet_hours_end: quietHoursEnd,
    };

    const notificationPreferencesPayload: TablesInsert<"notification_preferences"> = {
      user_id: parsedInput.userId,
      quiet_hours_enabled: parsedInput.quietHoursEnabled,
    };

    const [userSettingsResult, notificationPreferencesResult] = await Promise.all([
      supabase
        .from("user_settings")
        .upsert(userSettingsPayload, { onConflict: "user_id" })
        .select("*")
        .single(),
      supabase
        .from("notification_preferences")
        .upsert(notificationPreferencesPayload, { onConflict: "user_id" })
        .select("*")
        .single(),
    ]);

    throwIfSupabaseError(userSettingsResult.error);
    throwIfSupabaseError(notificationPreferencesResult.error);

    if (!userSettingsResult.data || !notificationPreferencesResult.data) {
      throw new Error("Quiet hours update returned no data.");
    }

    return {
      userSettings: userSettingsResult.data,
      notificationPreferences: notificationPreferencesResult.data,
    };
  } catch (error) {
    throw toSettingsActionError(error);
  }
}
