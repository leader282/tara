import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { getRecentPresencePulses } from "@/features/presence/api/presenceApi";
import type { RecentPresencePulse } from "@/features/presence/types";
import { toPresenceActionMessage } from "@/lib/errors/presenceErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

const UNKNOWN_COUPLE_KEY = "unknown";

function toError(error: unknown): Error | null {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Failed to load recent presence pulses.");
}

export type UseRecentPresencePulsesResult = {
  pulses: RecentPresencePulse[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  friendlyError: string | null;
};

export function useRecentPresencePulses(
  coupleId: string | null | undefined,
  limit = 10
): UseRecentPresencePulsesResult {
  const recentPulsesQuery = useQuery({
    queryKey: queryKeys.presence.recent(coupleId ?? UNKNOWN_COUPLE_KEY, limit),
    enabled: Boolean(coupleId),
    queryFn: async () => {
      if (!coupleId) {
        return [];
      }

      return getRecentPresencePulses(coupleId, limit);
    },
  });

  return useMemo(() => {
    const error = toError(recentPulsesQuery.error);

    if (error) {
      return {
        pulses: [],
        isLoading: false,
        isFetching: recentPulsesQuery.isFetching,
        error,
        friendlyError: toPresenceActionMessage(error),
      };
    }

    return {
      pulses: recentPulsesQuery.data ?? [],
      isLoading: recentPulsesQuery.isLoading,
      isFetching: recentPulsesQuery.isFetching,
      error: null,
      friendlyError: null,
    };
  }, [
    recentPulsesQuery.data,
    recentPulsesQuery.error,
    recentPulsesQuery.isFetching,
    recentPulsesQuery.isLoading,
  ]);
}
