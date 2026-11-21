import { useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { coupleRitualRowSchema } from "@/features/rituals/schemas";
import { queryKeys } from "@/lib/query/queryKeys";
import { supabase } from "@/lib/supabase/client";

// supabase.channel() returns the existing channel for a reused name, and adding listeners to
// an already-subscribed channel throws, so the rituals tab and an open ritual detail each need
// their own name.
let nextChannelId = 0;

export function useRitualRealtime(
  coupleId: string | null | undefined,
  enabled = true
): void {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !coupleId) {
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

    nextChannelId += 1;
    const channel = supabase
      .channel(`ritual-updates-${coupleId}-${nextChannelId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "couple_rituals",
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          const parsedRitual = coupleRitualRowSchema.safeParse(payload.new);
          if (!parsedRitual.success) {
            return;
          }

          if (parsedRitual.data.couple_id !== coupleId) {
            return;
          }

          void Promise.all([
            queryClient.invalidateQueries({
              queryKey: queryKeys.rituals.todayList(coupleId),
            }),
            queryClient.invalidateQueries({
              queryKey: queryKeys.rituals.historyList(coupleId),
            }),
            queryClient.invalidateQueries({
              queryKey: queryKeys.rituals.detailList(parsedRitual.data.id),
            }),
            queryClient.invalidateQueries({
              queryKey: queryKeys.timeline.listPrefix(coupleId),
            }),
          ]);
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
