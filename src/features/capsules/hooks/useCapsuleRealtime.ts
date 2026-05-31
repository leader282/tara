import { useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { subscribeToCapsuleMetadata } from "@/features/capsules/api/capsulesApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { queryKeys } from "@/lib/query/queryKeys";

export function useCapsuleRealtime(
  coupleId: string | null | undefined,
  activeCapsuleId?: string | null,
  enabled = true
): void {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !coupleId) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    const invalidateCapsuleQueries = (capsuleId: string) => {
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.capsules.listPrefix(coupleId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.capsules.detailList(capsuleId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.timeline.all,
        }),
      ]);

      if (activeCapsuleId && activeCapsuleId === capsuleId && user?.id) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.capsules.detail(capsuleId, user.id),
        });
      }

      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.couple.home(user.id),
        });
      }
    };

    unsubscribeRef.current = subscribeToCapsuleMetadata({
      coupleId,
      onInsert: (capsule) => {
        invalidateCapsuleQueries(capsule.id);
      },
      onUpdate: (capsule) => {
        invalidateCapsuleQueries(capsule.id);
      },
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [activeCapsuleId, coupleId, enabled, isAuthenticated, queryClient, user?.id]);
}
