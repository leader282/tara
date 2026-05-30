import { useQuery } from "@tanstack/react-query";

import { getCurrentProfile } from "@/features/profile/api/profileApi";
import { queryKeys } from "@/lib/query/queryKeys";

const ANONYMOUS_USER_KEY = "anonymous";

export function useCurrentProfile(userId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.profile.current(userId ?? ANONYMOUS_USER_KEY),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        return null;
      }

      return getCurrentProfile(userId);
    },
  });
}
