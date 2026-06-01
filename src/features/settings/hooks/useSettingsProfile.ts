import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { getSettingsProfile } from "@/features/settings/api/settingsApi";
import { queryKeys } from "@/lib/query/queryKeys";

const ANONYMOUS_USER_KEY = "anonymous";

export function useSettingsProfile(userIdOverride?: string | null) {
  const { user } = useAuth();
  const userId = userIdOverride ?? user?.id ?? null;

  return useQuery({
    queryKey: queryKeys.settings.profile(userId ?? ANONYMOUS_USER_KEY),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        return null;
      }

      return getSettingsProfile(userId);
    },
  });
}
