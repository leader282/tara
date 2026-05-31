import { useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { subscribeToPresencePulses } from "@/features/presence/api/presenceApi";
import type { RecentPresencePulse } from "@/features/presence/types";
import { queryKeys } from "@/lib/query/queryKeys";

export function usePresenceRealtime(
  coupleId: string | null | undefined,
  currentUserId: string | null | undefined,
  onIncomingPulse?: (pulse: RecentPresencePulse) => void,
  enabled = true
): void {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const onIncomingPulseRef = useRef(onIncomingPulse);

  useEffect(() => {
    onIncomingPulseRef.current = onIncomingPulse;
  }, [onIncomingPulse]);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !currentUserId || !coupleId) {
      return;
    }

    const unsubscribe = subscribeToPresencePulses({
      coupleId,
      onInsert: (pulse) => {
        if (pulse.couple_id !== coupleId) {
          return;
        }

        void queryClient.invalidateQueries({
          queryKey: queryKeys.presence.recentList(coupleId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.timeline.all,
        });

        if (pulse.sender_id === currentUserId) {
          return;
        }

        onIncomingPulseRef.current?.(pulse);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [coupleId, currentUserId, enabled, isAuthenticated, queryClient]);
}
