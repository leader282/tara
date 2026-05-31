export const CAPSULE_STATUSES = [
  "locked",
  "openable",
  "opened",
  "created_by_me",
  "unavailable",
] as const;

export const CAPSULE_DETAIL_STATUSES = [
  "locked",
  "openable",
  "opened",
  "creator_preview",
  "error",
] as const;

export const CAPSULE_UNLOCK_TYPES = ["date"] as const;

export const DEFAULT_CAPSULE_UNLOCK_TIME = "09:00";
export const CAPSULE_MAX_TITLE_LENGTH = 120;
export const CAPSULE_MAX_NOTE_LENGTH = 5000;
export const CAPSULE_MAX_EMOTIONAL_CONTEXT_LENGTH = 240;
