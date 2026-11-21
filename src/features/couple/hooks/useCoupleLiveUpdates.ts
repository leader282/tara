import { useEffect } from "react";
import { AppState } from "react-native";

import { useQueryClient, type QueryKey } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { queryKeys } from "@/lib/query/queryKeys";
import { supabase } from "@/lib/supabase/client";

// supabase.channel() returns the existing channel for a reused name, so each subscription gets
// its own.
let nextChannelId = 0;

const RESUME_REFRESH_AFTER_MS = 30_000;

// Keeps everything both partners see in sync while the couple space is open: rituals, capsules,
// the timeline, the partner's profile, and shared settings. Unpairing archives the couple before
// this member can be told, so it arrives as an update to their own membership row.
export function useCoupleLiveUpdates(coupleId: string | null | undefined): void {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !coupleId || !userId) {
      return;
    }

    // Screens don't refetch on mount, so refresh cached data for screens that aren't open too.
    const refresh = (...keys: QueryKey[]) => {
      for (const queryKey of keys) {
        void queryClient.invalidateQueries({ queryKey, refetchType: "all" });
      }
    };

    const refreshCouple = () =>
      refresh(queryKeys.couple.all, queryKeys.settings.couple(coupleId), queryKeys.timeline.all);
    const refreshRituals = () => refresh(queryKeys.rituals.all, queryKeys.timeline.all);
    const refreshCapsules = () =>
      refresh(queryKeys.capsules.all, queryKeys.timeline.all, queryKeys.couple.home(userId));
    const refreshTimeline = () => refresh(queryKeys.timeline.all);
    const refreshPartnerProfile = () => refresh(queryKeys.couple.home(userId));
    const refreshCoupleSettings = () =>
      refresh(queryKeys.settings.couple(coupleId), queryKeys.couple.home(userId));
    // Anything may have changed while the app was in the background or the connection was down.
    const refreshEverything = () =>
      refresh(
        queryKeys.couple.all,
        queryKeys.settings.couple(coupleId),
        queryKeys.rituals.all,
        queryKeys.capsules.all,
        queryKeys.timeline.all,
        queryKeys.presence.all
      );

    const coupleFilter = `couple_id=eq.${coupleId}`;
    let hasSubscribed = false;

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
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "couple_rituals", filter: coupleFilter },
        refreshRituals
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "couple_rituals", filter: coupleFilter },
        refreshRituals
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "memory_capsules", filter: coupleFilter },
        refreshCapsules
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "memory_capsules", filter: coupleFilter },
        refreshCapsules
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "timeline_items", filter: coupleFilter },
        refreshTimeline
      )
      // Profiles only reach their owner and their active partner.
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, refreshPartnerProfile)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "couple_settings", filter: coupleFilter },
        refreshCoupleSettings
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          return;
        }

        // The channel rejoins by itself after a dropped connection; catch up on what was missed.
        if (hasSubscribed) {
          refreshEverything();
        }
        hasSubscribed = true;
      });

    // Short trips away, like picking a photo, keep the connection, so only refresh after longer ones.
    let backgroundedAt: number | null = null;
    const appStateSubscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState !== "active") {
        backgroundedAt ??= Date.now();
        return;
      }

      if (backgroundedAt !== null && Date.now() - backgroundedAt >= RESUME_REFRESH_AFTER_MS) {
        refreshEverything();
      }
      backgroundedAt = null;
    });

    return () => {
      appStateSubscription.remove();
      void supabase.removeChannel(channel);
    };
  }, [coupleId, isAuthenticated, queryClient, userId]);
}
