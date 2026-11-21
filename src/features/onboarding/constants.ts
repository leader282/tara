import type { EmotionalTone, NotificationTone } from "@/features/onboarding/types";

type ToneCopy = {
  label: string;
  description: string;
  emoji: string;
};

export const EMOTIONAL_TONE_COPY: Record<EmotionalTone, ToneCopy> = {
  soft: {
    label: "Soft",
    description: "Gentle and calm check-ins.",
    emoji: "🌸",
  },
  playful: {
    label: "Playful",
    description: "Light, cute moments that keep things fun.",
    emoji: "🎈",
  },
  grounding: {
    label: "Grounding",
    description: "Steady connection when life feels busy.",
    emoji: "🌿",
  },
  romantic: {
    label: "Romantic",
    description: "More affection in your everyday rhythm.",
    emoji: "🌹",
  },
  minimal: {
    label: "Minimal",
    description: "Simple, low-noise ways to stay close.",
    emoji: "🤍",
  },
};

export const NOTIFICATION_TONE_COPY: Record<NotificationTone, ToneCopy> = {
  gentle: {
    label: "Gentle",
    description: "Warm and calm reminders.",
    emoji: "🕊️",
  },
  minimal: {
    label: "Minimal",
    description: "Quiet and low-key nudges.",
    emoji: "🔕",
  },
  playful: {
    label: "Playful",
    description: "A little extra spark in tone.",
    emoji: "🎉",
  },
};
