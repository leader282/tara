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
    listPrefix: (coupleId: string) => ["timeline", "list", coupleId] as const,
    list: (coupleId: string, pageSize = 20) => ["timeline", "list", coupleId, pageSize] as const,
    couple: (coupleId: string) => ["timeline", "couple", coupleId] as const,
  },
  rituals: {
    all: ["rituals"] as const,
    todayList: (coupleId: string) => ["rituals", "today", coupleId] as const,
    today: (coupleId: string, userId: string) => ["rituals", "today", coupleId, userId] as const,
    detailList: (coupleRitualId: string) => ["rituals", "detail", coupleRitualId] as const,
    detail: (coupleRitualId: string, userId: string) =>
      ["rituals", "detail", coupleRitualId, userId] as const,
    historyList: (coupleId: string) => ["rituals", "history", coupleId] as const,
    history: (coupleId: string, limit = 30) => ["rituals", "history", coupleId, limit] as const,
  },
  capsules: {
    all: ["capsules"] as const,
    listPrefix: (coupleId: string) => ["capsules", "list", coupleId] as const,
    list: (coupleId: string, userId: string) => ["capsules", "list", coupleId, userId] as const,
    detailList: (capsuleId: string) => ["capsules", "detail", capsuleId] as const,
    detail: (capsuleId: string, userId: string) => ["capsules", "detail", capsuleId, userId] as const,
  },
  media: {
    all: ["media"] as const,
    asset: (mediaAssetId: string) => ["media", "asset", mediaAssetId] as const,
    signedUrl: (storagePath: string, expiresInSeconds = 300) =>
      ["media", "signedUrl", storagePath, expiresInSeconds] as const,
  },
};
