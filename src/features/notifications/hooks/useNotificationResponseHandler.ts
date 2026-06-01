import { useCallback } from "react";

import type * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";

import { resolveNotificationRouteFromResponse } from "@/features/notifications/services/notificationNavigation";

export function useNotificationResponseHandler() {
  const router = useRouter();

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse | null) => {
      const route = resolveNotificationRouteFromResponse(response);
      if (!route) {
        return;
      }

      router.push(route);
    },
    [router],
  );

  return {
    handleNotificationResponse,
  };
}
