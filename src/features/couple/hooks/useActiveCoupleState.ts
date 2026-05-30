import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { getActiveCoupleState } from "@/features/couple/api/coupleApi";
import type { ActiveCoupleState } from "@/features/couple/types";
import { queryKeys } from "@/lib/query/queryKeys";

const ANONYMOUS_USER_KEY = "anonymous";

function toError(error: unknown): Error | null {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Failed to load active couple state.");
}

export type UseActiveCoupleStateResult = {
  state: ActiveCoupleState;
  error: Error | null;
  isLoading: boolean;
};

export function useActiveCoupleState(): UseActiveCoupleStateResult {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const userId = user?.id;

  const activeCoupleQuery = useQuery({
    queryKey: queryKeys.couple.activeState(userId ?? ANONYMOUS_USER_KEY),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        return { status: "none" } as const;
      }

      return getActiveCoupleState(userId);
    },
  });

  return useMemo(() => {
    const isLoading = isInitializing || (isAuthenticated && activeCoupleQuery.isLoading);
    const error = toError(activeCoupleQuery.error);

    if (isLoading) {
      return {
        state: { status: "loading" } as const,
        error: null,
        isLoading: true,
      };
    }

    if (!isAuthenticated) {
      return {
        state: { status: "none" } as const,
        error: null,
        isLoading: false,
      };
    }

    if (error) {
      return {
        state: { status: "none" } as const,
        error,
        isLoading: false,
      };
    }

    return {
      state: activeCoupleQuery.data ?? ({ status: "none" } as const),
      error: null,
      isLoading: false,
    };
  }, [
    activeCoupleQuery.data,
    activeCoupleQuery.error,
    activeCoupleQuery.isLoading,
    isAuthenticated,
    isInitializing,
  ]);
}
