import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { queryKeys } from "@/lib/query/queryKeys";

export function useRetryAppGates(): () => void {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useCallback(() => {
    if (!userId) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: queryKeys.profile.current(userId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.couple.activeState(userId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.couple.home(userId) });
  }, [queryClient, userId]);
}
