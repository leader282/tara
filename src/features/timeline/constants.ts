export const TIMELINE_ITEM_TYPES = [
  "presence_sent",
  "ritual_completed",
  "capsule_created",
  "capsule_opened",
  "countdown_updated",
  "parallel_moment_completed",
] as const;

export const DEFAULT_TIMELINE_PAGE_SIZE = 20;
export const MAX_TIMELINE_PAGE_SIZE = 50;

// Timeline table is not in the realtime publication yet.
export const TIMELINE_REALTIME_PUBLICATION_ENABLED = false;

export const TIMELINE_TYPE_DISPLAY = {
  presence_sent: {
    label: "Presence pulse",
    iconText: "PULSE",
  },
  ritual_completed: {
    label: "Ritual completed",
    iconText: "RITUAL",
  },
  capsule_created: {
    label: "Capsule created",
    iconText: "CAPSULE",
  },
  capsule_opened: {
    label: "Capsule opened",
    iconText: "OPEN",
  },
  countdown_updated: {
    label: "Countdown updated",
    iconText: "MEETUP",
  },
  parallel_moment_completed: {
    label: "Parallel moment",
    iconText: "SYNC",
  },
} as const satisfies Record<
  (typeof TIMELINE_ITEM_TYPES)[number],
  {
    label: string;
    iconText: string;
  }
>;

export const TIMELINE_UNKNOWN_TYPE_DISPLAY = {
  label: "Shared moment",
  iconText: "MOMENT",
} as const;
