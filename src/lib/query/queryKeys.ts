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
  },
  invite: {
    all: ["invite"] as const,
    active: (coupleId: string) => ["invite", "active", coupleId] as const,
  },
};
