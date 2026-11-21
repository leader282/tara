import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { queryKeys } from "@/lib/query/queryKeys";
import { supabase } from "@/lib/supabase/client";

// supabase.channel() returns the existing channel for a reused name, so each subscription gets
// its own.
let nextChannelId = 0;

// Reunion edits and shared settings arrive as updates to the couple row. Unpairing archives the
// couple before this member can be told, so it arrives as an update to their own membership row.
export function useCoupleLiveUpdates(coupleId: string | null | undefined): void {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !coupleId || !userId) {
      return;
    }

    // Screens don't refetch on mount, so refresh cached couple data that isn't on screen too.
    const refreshCouple = () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.couple.all, refetchType: "all" }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.settings.couple(coupleId),
          refetchType: "all",
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.timeline.listPrefix(coupleId) }),
      ]);
    };

    nextChannelId += 1;
    const channel = supabase
      .channel(`couple-updates-${coupleId}-${nextChannelId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "couples", filter: `id=eq.${coupleId}` },
        refreshCouple
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "couple_members", filter: `user_id=eq.${userId}` },
        refreshCouple
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, isAuthenticated, queryClient, userId]);
}
