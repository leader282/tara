export const queryKeys = {
  profile: {
    current: (userId: string) => ["profile", "current", userId] as const,
    settings: (userId: string) => ["profile", "settings", userId] as const,
    notificationPreferences: (userId: string) =>
      ["profile", "notificationPreferences", userId] as const,
  },
};
