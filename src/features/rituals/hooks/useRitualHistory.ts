import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { getRitualHistory } from "@/features/rituals/api/ritualsApi";
import { DEFAULT_RITUAL_HISTORY_LIMIT } from "@/features/rituals/constants";
import type { RitualHistoryItem } from "@/features/rituals/types";
import { toRitualActionMessage } from "@/lib/errors/ritualErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

const UNKNOWN_COUPLE_KEY = "unknown";

function toError(error: unknown): Error | null {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Failed to load ritual history.");
}

export type UseRitualHistoryResult = {
  history: RitualHistoryItem[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  friendlyError: string | null;
};

export function useRitualHistory(
  coupleId: string | null | undefined,
  limit = DEFAULT_RITUAL_HISTORY_LIMIT
): UseRitualHistoryResult {
  const ritualHistoryQuery = useQuery({
    queryKey: queryKeys.rituals.history(coupleId ?? UNKNOWN_COUPLE_KEY, limit),
    enabled: Boolean(coupleId),
    queryFn: async () => {
      if (!coupleId) {
        return [];
      }

      return getRitualHistory(coupleId, limit);
    },
  });

  return useMemo(() => {
    const error = toError(ritualHistoryQuery.error);
    if (error) {
      return {
        history: [],
        isLoading: false,
        isFetching: ritualHistoryQuery.isFetching,
        error,
        friendlyError: toRitualActionMessage(error),
      };
    }

    return {
      history: ritualHistoryQuery.data ?? [],
      isLoading: ritualHistoryQuery.isLoading,
      isFetching: ritualHistoryQuery.isFetching,
      error: null,
      friendlyError: null,
    };
  }, [
    ritualHistoryQuery.data,
    ritualHistoryQuery.error,
    ritualHistoryQuery.isFetching,
    ritualHistoryQuery.isLoading,
  ]);
}
