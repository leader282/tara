import { useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { TIMELINE_REALTIME_PUBLICATION_ENABLED } from "@/features/timeline/constants";
import { queryKeys } from "@/lib/query/queryKeys";
import { supabase } from "@/lib/supabase/client";

export function useTimelineRealtime(
  coupleId: string | null | undefined,
  enabled: boolean = true
): void {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (
      !enabled ||
      !isAuthenticated ||
      !coupleId ||
      !TIMELINE_REALTIME_PUBLICATION_ENABLED
    ) {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`timeline-items-${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "timeline_items",
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.timeline.listPrefix(coupleId),
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [coupleId, enabled, isAuthenticated, queryClient]);
}
