import { useQuery } from "@tanstack/react-query";

import { getCurrentUserSettings } from "@/features/profile/api/userSettingsApi";
import { queryKeys } from "@/lib/query/queryKeys";

const ANONYMOUS_USER_KEY = "anonymous";

export function useUserSettings(userId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.profile.settings(userId ?? ANONYMOUS_USER_KEY),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        return null;
      }

      return getCurrentUserSettings(userId);
    },
  });
}
