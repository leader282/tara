import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { getCapsuleDetail } from "@/features/capsules/api/capsulesApi";
import type { CapsuleDetail, CapsuleDetailStatus } from "@/features/capsules/types";
import { toCapsuleActionMessage } from "@/lib/errors/capsuleErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

const UNKNOWN_CAPSULE_KEY = "unknown";
const UNKNOWN_USER_KEY = "anonymous";

function toError(error: unknown): Error | null {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Failed to load memory capsule detail.");
}

export type UseCapsuleDetailResult = {
  detail: CapsuleDetail | null;
  status: CapsuleDetailStatus | "loading";
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  friendlyError: string | null;
};

export function useCapsuleDetail(
  capsuleId: string | null | undefined,
  currentUserId: string | null | undefined
): UseCapsuleDetailResult {
  const capsuleDetailQuery = useQuery({
    queryKey: queryKeys.capsules.detail(capsuleId ?? UNKNOWN_CAPSULE_KEY, currentUserId ?? UNKNOWN_USER_KEY),
    enabled: Boolean(capsuleId && currentUserId),
    queryFn: async () => {
      if (!capsuleId || !currentUserId) {
        return null;
      }

      return getCapsuleDetail(capsuleId, currentUserId);
    },
  });

  return useMemo(() => {
    if (capsuleDetailQuery.isLoading) {
      return {
        detail: null,
        status: "loading" as const,
        isLoading: true,
        isFetching: capsuleDetailQuery.isFetching,
        error: null,
        friendlyError: null,
      };
    }

    const error = toError(capsuleDetailQuery.error);
    if (error) {
      return {
        detail: null,
        status: "error" as const,
        isLoading: false,
        isFetching: capsuleDetailQuery.isFetching,
        error,
        friendlyError: toCapsuleActionMessage(error),
      };
    }

    if (!capsuleDetailQuery.data) {
      return {
        detail: null,
        status: "error" as const,
        isLoading: false,
        isFetching: capsuleDetailQuery.isFetching,
        error: null,
        friendlyError: null,
      };
    }

    return {
      detail: capsuleDetailQuery.data,
      status: capsuleDetailQuery.data.status,
      isLoading: false,
      isFetching: capsuleDetailQuery.isFetching,
      error: null,
      friendlyError: null,
    };
  }, [
    capsuleDetailQuery.data,
    capsuleDetailQuery.error,
    capsuleDetailQuery.isFetching,
    capsuleDetailQuery.isLoading,
  ]);
}
