export const NOTIFICATION_TYPES = [
  "presence_pulse",
  "ritual_ready",
  "ritual_reminder",
  "capsule_unlocked",
  "countdown_reminder",
  "system_test",
] as const;

export const NOTIFICATION_PERMISSION_STATES = [
  "undetermined",
  "denied",
  "granted",
  "provisional",
] as const;

export const NOTIFICATION_ANDROID_CHANNEL_ID = "tara-gentle-updates";
export const NOTIFICATION_ANDROID_CHANNEL_NAME = "Gentle updates";

export const NOTIFICATION_FALLBACK_ROUTE = "/(couple)";
