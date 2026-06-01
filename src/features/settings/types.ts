import type {
  EmotionalTone,
  LoveSignal,
  NotificationTone,
} from "@/features/onboarding/types";
import type { Tables } from "@/lib/supabase/database.types";

import type { SETTINGS_RITUAL_FREQUENCIES } from "@/features/settings/constants";

export type SettingsProfile = {
  profile: Tables<"profiles"> | null;
  userSettings: Tables<"user_settings"> | null;
  notificationPreferences: Tables<"notification_preferences"> | null;
};

export type SettingsRitualFrequency = (typeof SETTINGS_RITUAL_FREQUENCIES)[number];

export type UpdateSettingsProfileInput = {
  userId: string;
  displayName: string;
  timezone: string;
  city?: string | null;
  country?: string | null;
  birthday?: string | null;
  emotionalTone?: EmotionalTone | null;
  preferredLoveSignals?: LoveSignal[];
  notificationTone?: NotificationTone | null;
};

export type UpdateQuietHoursInput = {
  userId: string;
  quietHoursEnabled: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
};

export type UpdateQuietHoursResult = {
  userSettings: Tables<"user_settings">;
  notificationPreferences: Tables<"notification_preferences">;
};

export type CoupleSettingsSummary = {
  coupleId: string;
  anniversaryDate: string | null;
  ritualFrequency: SettingsRitualFrequency;
  theme: string | null;
  privacyLevel: string;
  coupleUpdatedAt: string | null;
  coupleSettingsUpdatedAt: string | null;
};

export type UpdateCoupleSharedSettingsInput = {
  anniversaryDate?: string | null;
  ritualFrequency?: SettingsRitualFrequency | null;
  theme?: string | null;
};
