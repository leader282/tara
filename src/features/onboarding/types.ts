export const EMOTIONAL_TONES = [
  "soft",
  "playful",
  "grounding",
  "romantic",
  "minimal",
] as const;

export const LOVE_SIGNALS = [
  "thinking_of_you",
  "good_morning_good_night",
  "shared_photos",
  "tiny_notes",
  "rituals",
  "countdowns",
  "memory_capsules",
] as const;

export const NOTIFICATION_TONES = ["gentle", "minimal", "playful"] as const;

export type EmotionalTone = (typeof EMOTIONAL_TONES)[number];
export type LoveSignal = (typeof LOVE_SIGNALS)[number];
export type NotificationTone = (typeof NOTIFICATION_TONES)[number];
