import { useQuery } from "@tanstack/react-query";

import { getCoupleSettings } from "@/features/settings/api/coupleSettingsApi";
import { queryKeys } from "@/lib/query/queryKeys";

const NO_COUPLE_KEY = "none";

export function useCoupleSettings(coupleId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.settings.couple(coupleId ?? NO_COUPLE_KEY),
    enabled: Boolean(coupleId),
    queryFn: async () => {
      if (!coupleId) {
        return null;
      }

      return getCoupleSettings(coupleId);
    },
  });
}
