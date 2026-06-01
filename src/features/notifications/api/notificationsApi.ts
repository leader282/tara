import type { PostgrestError } from "@supabase/supabase-js";

import {
  notificationPreferencesSchema,
  pushTokenRowSchema,
  registerPushTokenInputSchema,
  unregisterPushTokenSchema,
  upsertNotificationPreferencesInputSchema,
  userIdSchema,
} from "@/features/notifications/schemas";
import type {
  NotificationPreferences,
  RegisterPushTokenInput,
  RegisteredPushToken,
  UpsertNotificationPreferencesInput,
} from "@/features/notifications/types";
import {
  NotificationActionError,
  toNotificationActionError,
} from "@/lib/errors/notificationErrorMessages";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { supabase } from "@/lib/supabase/client";

function throwIfNotificationError(error: PostgrestError | null): void {
  if (error) {
    throw toNotificationActionError(error);
  }
}

export async function registerPushToken(
  input: RegisterPushTokenInput,
): Promise<RegisteredPushToken> {
  try {
    const parsedInput = registerPushTokenInputSchema.parse(input);

    const { data, error } = await supabase.rpc("register_push_token", {
      p_token: parsedInput.token,
      p_platform: parsedInput.platform,
      p_token_type: parsedInput.tokenType,
      p_native_token: parsedInput.nativeToken ?? undefined,
      p_device_id: parsedInput.deviceId ?? undefined,
      p_project_id: parsedInput.projectId ?? undefined,
      p_app_version: parsedInput.appVersion ?? undefined,
    });

    throwIfNotificationError(error);

    if (!data) {
      throw new NotificationActionError("registration_failed");
    }

    return pushTokenRowSchema.parse(data);
  } catch (error) {
    throw toNotificationActionError(error);
  }
}

export async function unregisterPushToken(token: string): Promise<boolean> {
  try {
    const parsedToken = unregisterPushTokenSchema.parse(token);
    const { data, error } = await supabase.rpc("unregister_push_token", {
      p_token: parsedToken,
    });

    throwIfNotificationError(error);

    if (typeof data !== "boolean") {
      throw new NotificationActionError("unregistration_failed");
    }

    return data;
  } catch (error) {
    throw toNotificationActionError(error);
  }
}

export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences | null> {
  try {
    const parsedUserId = userIdSchema.parse(userId);
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", parsedUserId)
      .maybeSingle();

    throwIfNotificationError(error);

    if (!data) {
      return null;
    }

    return notificationPreferencesSchema.parse(data);
  } catch (error) {
    throw toNotificationActionError(error);
  }
}

export async function upsertNotificationPreferences(
  input: UpsertNotificationPreferencesInput,
): Promise<NotificationPreferences> {
  try {
    const parsedInput = upsertNotificationPreferencesInputSchema.parse(input);

    const payload: TablesInsert<"notification_preferences"> = {
      user_id: parsedInput.userId,
    };

    if (parsedInput.presenceEnabled !== undefined) {
      payload.presence_enabled = parsedInput.presenceEnabled;
    }

    if (parsedInput.ritualsEnabled !== undefined) {
      payload.rituals_enabled = parsedInput.ritualsEnabled;
    }

    if (parsedInput.capsulesEnabled !== undefined) {
      payload.capsules_enabled = parsedInput.capsulesEnabled;
    }

    if (parsedInput.countdownEnabled !== undefined) {
      payload.countdown_enabled = parsedInput.countdownEnabled;
    }

    if (parsedInput.quietHoursEnabled !== undefined) {
      payload.quiet_hours_enabled = parsedInput.quietHoursEnabled;
    }

    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();

    throwIfNotificationError(error);

    if (!data) {
      throw new NotificationActionError("preferences_failed");
    }

    return notificationPreferencesSchema.parse(data);
  } catch (error) {
    throw toNotificationActionError(error);
  }
}
