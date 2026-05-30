import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { getCoupleHomeData } from "@/features/couple/api/coupleHomeApi";
import type { CoupleHomeResult } from "@/features/couple/types";
import { toCoupleActionMessage } from "@/lib/errors/coupleErrorMessages";
import { queryKeys } from "@/lib/query/queryKeys";

const ANONYMOUS_USER_KEY = "anonymous";

function toError(error: unknown): Error | null {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Failed to load couple home state.");
}

export type UseCoupleHomeResult = {
  state: { status: "loading" } | CoupleHomeResult;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  friendlyError: string | null;
};

export function useCoupleHome(): UseCoupleHomeResult {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const userId = user?.id;

  const coupleHomeQuery = useQuery({
    queryKey: queryKeys.couple.home(userId ?? ANONYMOUS_USER_KEY),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        return { status: "none" } as const;
      }

      return getCoupleHomeData(userId);
    },
  });

  return useMemo(() => {
    const error = toError(coupleHomeQuery.error);
    const isLoading = isInitializing || (isAuthenticated && coupleHomeQuery.isLoading);

    if (isLoading) {
      return {
        state: { status: "loading" } as const,
        isLoading: true,
        isFetching: coupleHomeQuery.isFetching,
        error: null,
        friendlyError: null,
      };
    }

    if (!isAuthenticated) {
      return {
        state: { status: "none" } as const,
        isLoading: false,
        isFetching: coupleHomeQuery.isFetching,
        error: null,
        friendlyError: null,
      };
    }

    if (error) {
      return {
        state: { status: "none" } as const,
        isLoading: false,
        isFetching: coupleHomeQuery.isFetching,
        error,
        friendlyError: toCoupleActionMessage(error),
      };
    }

    return {
      state: coupleHomeQuery.data ?? ({ status: "none" } as const),
      isLoading: false,
      isFetching: coupleHomeQuery.isFetching,
      error: null,
      friendlyError: null,
    };
  }, [
    coupleHomeQuery.data,
    coupleHomeQuery.error,
    coupleHomeQuery.isFetching,
    coupleHomeQuery.isLoading,
    isAuthenticated,
    isInitializing,
  ]);
}
