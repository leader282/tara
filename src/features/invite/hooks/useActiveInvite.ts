import { useQuery } from "@tanstack/react-query";

import { getActiveInviteForCouple } from "@/features/invite/api/inviteApi";
import { queryKeys } from "@/lib/query/queryKeys";

const UNKNOWN_COUPLE_KEY = "unknown";

export function useActiveInvite(coupleId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.invite.active(coupleId ?? UNKNOWN_COUPLE_KEY),
    enabled: Boolean(coupleId),
    queryFn: async () => {
      if (!coupleId) {
        return null;
      }

      return getActiveInviteForCouple(coupleId);
    },
  });
}
