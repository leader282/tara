import type { Tables } from "@/lib/supabase/database.types";
import type {
  EmotionalTone,
  LoveSignal,
  NotificationTone,
} from "@/features/onboarding/types";

export type Profile = Tables<"profiles">;
export type UserSettings = Tables<"user_settings">;
export type NotificationPreferences = Tables<"notification_preferences">;

export type UpsertCurrentProfileInput = {
  userId: string;
  displayName: string;
  timezone: string;
  city?: string | null;
  country?: string | null;
  birthday?: string | null;
};

export type UpsertCurrentUserSettingsInput = {
  userId: string;
  emotionalTone?: EmotionalTone | null;
  preferredLoveSignals?: LoveSignal[];
  notificationTone?: NotificationTone | null;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
};
