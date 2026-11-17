import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/queryKeys";

// Realtime does not replay events missed while the app was in the background, so the caches it feeds are refetched on return.
const REALTIME_BACKED_QUERY_KEYS = [
  queryKeys.couple.all,
  queryKeys.presence.all,
  queryKeys.rituals.all,
  queryKeys.capsules.all,
  queryKeys.timeline.all,
];

export function useResyncOnForeground(enabled: boolean): void {
  const queryClient = useQueryClient();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const returnedToForeground = appStateRef.current !== "active" && nextAppState === "active";
      appStateRef.current = nextAppState;

      if (!returnedToForeground) {
        return;
      }

      for (const queryKey of REALTIME_BACKED_QUERY_KEYS) {
        void queryClient.invalidateQueries({ queryKey, refetchType: "all" });
      }
    });

    return () => subscription.remove();
  }, [enabled, queryClient]);
}
