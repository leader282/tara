export const queryKeys = {
  profile: {
    current: (userId: string) => ["profile", "current", userId] as const,
    settings: (userId: string) => ["profile", "settings", userId] as const,
    notificationPreferences: (userId: string) =>
      ["profile", "notificationPreferences", userId] as const,
  },
  couple: {
    all: ["couple"] as const,
    activeState: (userId: string) => ["couple", "activeState", userId] as const,
    home: (userId: string) => ["couple", "home", userId] as const,
  },
  invite: {
    all: ["invite"] as const,
    active: (coupleId: string) => ["invite", "active", coupleId] as const,
  },
  presence: {
    all: ["presence"] as const,
    recentList: (coupleId: string) => ["presence", "recent", coupleId] as const,
    recent: (coupleId: string, limit = 10) =>
      ["presence", "recent", coupleId, limit] as const,
  },
  timeline: {
    all: ["timeline"] as const,
    couple: (coupleId: string) => ["timeline", "couple", coupleId] as const,
  },
};
