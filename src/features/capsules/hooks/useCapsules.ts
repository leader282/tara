import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { getCapsules } from "@/features/capsules/api/capsulesApi";
import type { CapsuleListItem } from "@/features/capsules/types";
import { toCapsuleActionMessage } from "@/lib/errors/capsuleErrorMessages";
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

  return new Error("Failed to load memory capsules.");
}

export type UseCapsulesResult = {
  capsules: CapsuleListItem[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  friendlyError: string | null;
};

export function useCapsules(
  coupleId: string | null | undefined,
  currentUserId: string | null | undefined
): UseCapsulesResult {
  const capsulesQuery = useQuery({
    queryKey: queryKeys.capsules.list(coupleId ?? UNKNOWN_COUPLE_KEY, currentUserId ?? UNKNOWN_USER_KEY),
    enabled: Boolean(coupleId && currentUserId),
    queryFn: async () => {
      if (!coupleId || !currentUserId) {
        return [];
      }

      return getCapsules(coupleId, currentUserId);
    },
  });

  return useMemo(() => {
    const error = toError(capsulesQuery.error);
    if (error) {
      return {
        capsules: [],
        isLoading: false,
        isFetching: capsulesQuery.isFetching,
        error,
        friendlyError: toCapsuleActionMessage(error),
      };
    }

    return {
      capsules: capsulesQuery.data ?? [],
      isLoading: capsulesQuery.isLoading,
      isFetching: capsulesQuery.isFetching,
      error: null,
      friendlyError: null,
    };
  }, [
    capsulesQuery.data,
    capsulesQuery.error,
    capsulesQuery.isFetching,
    capsulesQuery.isLoading,
  ]);
}
