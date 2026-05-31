export const RITUAL_CATEGORIES = [
  "daily_checkin",
  "gratitude",
  "parallel_moment",
  "memory",
  "grounding",
  "playful",
] as const;

export const RITUAL_INPUT_TYPES = ["text", "text_or_photo", "photo"] as const;

export const PHASE8_SUPPORTED_RITUAL_INPUT_TYPES = ["text", "text_or_photo"] as const;
export const PHASE8_UNSUPPORTED_RITUAL_INPUT_TYPES = ["photo"] as const;

export const DEFAULT_RITUAL_HISTORY_LIMIT = 30;

const ritualCategorySet = new Set<string>(RITUAL_CATEGORIES);
const ritualInputTypeSet = new Set<string>(RITUAL_INPUT_TYPES);
const phase8SupportedInputTypeSet = new Set<string>(PHASE8_SUPPORTED_RITUAL_INPUT_TYPES);

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

export function isPhase8SupportedRitualInputType(
  value: string
): value is (typeof PHASE8_SUPPORTED_RITUAL_INPUT_TYPES)[number] {
  return phase8SupportedInputTypeSet.has(value);
}
