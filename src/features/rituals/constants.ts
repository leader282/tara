export const RITUAL_CATEGORIES = [
  "daily_checkin",
  "gratitude",
  "parallel_moment",
  "memory",
  "grounding",
  "playful",
] as const;

export const RITUAL_CATEGORY_LABELS: Record<(typeof RITUAL_CATEGORIES)[number], string> = {
  daily_checkin: "Check-in",
  gratitude: "Gratitude",
  parallel_moment: "Together, apart",
  memory: "Memory",
  grounding: "Grounding",
  playful: "Playful",
};

export const RITUAL_INPUT_TYPES = ["text", "text_or_photo", "photo"] as const;

// History shows the rituals before today. The daily prune-couple-history job deletes older ones.
export const DEFAULT_RITUAL_HISTORY_LIMIT = 5;

const ritualCategorySet = new Set<string>(RITUAL_CATEGORIES);
const ritualInputTypeSet = new Set<string>(RITUAL_INPUT_TYPES);

export function normalizeRitualCategory(
  value: string
): (typeof RITUAL_CATEGORIES)[number] {
  const normalizedValue = value.trim().toLowerCase();
  if (ritualCategorySet.has(normalizedValue)) {
    return normalizedValue as (typeof RITUAL_CATEGORIES)[number];
  }

  return "playful";
}

export function normalizeRitualInputType(
  value: string
): (typeof RITUAL_INPUT_TYPES)[number] {
  const normalizedValue = value.trim().toLowerCase();
  if (ritualInputTypeSet.has(normalizedValue)) {
    return normalizedValue as (typeof RITUAL_INPUT_TYPES)[number];
  }

  return "photo";
}
