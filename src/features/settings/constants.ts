import {
  EMOTIONAL_TONES,
  LOVE_SIGNALS,
  NOTIFICATION_TONES,
} from "@/features/onboarding/types";

export const SETTINGS_EMOTIONAL_TONES = EMOTIONAL_TONES;
export const SETTINGS_LOVE_SIGNALS = LOVE_SIGNALS;
export const SETTINGS_NOTIFICATION_TONES = NOTIFICATION_TONES;

export const SETTINGS_RITUAL_FREQUENCIES = ["daily", "few_times_week", "weekly"] as const;

// Couple theme values are intentionally open for now because no dedicated
// shared theme enum exists yet in the app domain layer.
export const SETTINGS_COUPLE_THEME_OPTIONS: readonly string[] = [];
