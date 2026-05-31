import { useMemo } from "react";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { getTodayRitualState } from "@/features/rituals/api/ritualsApi";
import type { TodayRitualState } from "@/features/rituals/types";
import { toRitualActionMessage } from "@/lib/errors/ritualErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

const UNKNOWN_COUPLE_KEY = "unknown";
const UNKNOWN_USER_KEY = "anonymous";

function toError(error: unknown): Error | null {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Failed to load today's ritual.");
}

export type UseTodayRitualResult = {
  state: TodayRitualState;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  friendlyError: string | null;
  refetch: UseQueryResult<TodayRitualState>["refetch"];
};

export function useTodayRitual(
  coupleId: string | null | undefined,
  currentUserId: string | null | undefined
): UseTodayRitualResult {
  const todayRitualQuery = useQuery({
    queryKey: queryKeys.rituals.today(coupleId ?? UNKNOWN_COUPLE_KEY, currentUserId ?? UNKNOWN_USER_KEY),
    enabled: Boolean(coupleId && currentUserId),
    queryFn: async () => {
      if (!coupleId || !currentUserId) {
        return {
          status: "unavailable",
          message: null,
        } as const;
      }

      return getTodayRitualState(coupleId, currentUserId);
    },
  });

  return useMemo(() => {
    if (!coupleId || !currentUserId) {
      return {
        state: {
          status: "unavailable",
          message: null,
        } as const,
        isLoading: false,
        isFetching: false,
        error: null,
        friendlyError: null,
        refetch: todayRitualQuery.refetch,
      };
    }

    if (todayRitualQuery.isLoading) {
      return {
        state: { status: "loading" } as const,
        isLoading: true,
        isFetching: todayRitualQuery.isFetching,
        error: null,
        friendlyError: null,
        refetch: todayRitualQuery.refetch,
      };
    }

    const error = toError(todayRitualQuery.error);
    if (error) {
      const friendlyError = toRitualActionMessage(error);
      return {
        state: {
          status: "error",
          message: friendlyError,
        } as const,
        isLoading: false,
        isFetching: todayRitualQuery.isFetching,
        error,
        friendlyError,
        refetch: todayRitualQuery.refetch,
      };
    }

    const state =
      todayRitualQuery.data ??
      ({
        status: "unavailable",
        message: null,
      } as const);

    return {
      state,
      isLoading: false,
      isFetching: todayRitualQuery.isFetching,
      error: null,
      friendlyError:
        state.status === "error" || state.status === "unavailable" ? state.message : null,
      refetch: todayRitualQuery.refetch,
    };
  }, [
    coupleId,
    currentUserId,
    todayRitualQuery.data,
    todayRitualQuery.error,
    todayRitualQuery.isFetching,
    todayRitualQuery.isLoading,
    todayRitualQuery.refetch,
  ]);
}
