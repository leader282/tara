import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { getRitualDetail } from "@/features/rituals/api/ritualsApi";
import type { RitualDetail } from "@/features/rituals/types";
import { toRitualActionMessage } from "@/lib/errors/ritualErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

const UNKNOWN_RITUAL_KEY = "unknown";
const UNKNOWN_USER_KEY = "anonymous";

function toError(error: unknown): Error | null {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Failed to load ritual detail.");
}

export type UseRitualDetailResult = {
  ritual: RitualDetail | null;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  friendlyError: string | null;
};

export function useRitualDetail(
  coupleRitualId: string | null | undefined,
  currentUserId: string | null | undefined
): UseRitualDetailResult {
  const ritualDetailQuery = useQuery({
    queryKey: queryKeys.rituals.detail(coupleRitualId ?? UNKNOWN_RITUAL_KEY, currentUserId ?? UNKNOWN_USER_KEY),
    enabled: Boolean(coupleRitualId && currentUserId),
    queryFn: async () => {
      if (!coupleRitualId || !currentUserId) {
        return null;
      }

      return getRitualDetail(coupleRitualId, currentUserId);
    },
  });

  return useMemo(() => {
    const error = toError(ritualDetailQuery.error);
    if (error) {
      return {
        ritual: null,
        isLoading: false,
        isFetching: ritualDetailQuery.isFetching,
        error,
        friendlyError: toRitualActionMessage(error),
      };
    }

    return {
      ritual: ritualDetailQuery.data ?? null,
      isLoading: ritualDetailQuery.isLoading,
      isFetching: ritualDetailQuery.isFetching,
      error: null,
      friendlyError: null,
    };
  }, [
    ritualDetailQuery.data,
    ritualDetailQuery.error,
    ritualDetailQuery.isFetching,
    ritualDetailQuery.isLoading,
  ]);
}
