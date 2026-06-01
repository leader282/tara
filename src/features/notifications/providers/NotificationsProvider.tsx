import { type PropsWithChildren, useCallback, useEffect, useRef } from "react";

import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import {
  registerPushToken,
  unregisterPushToken,
  upsertNotificationPreferences,
} from "@/features/notifications/api/notificationsApi";
import { useNotificationResponseHandler } from "@/features/notifications/hooks/useNotificationResponseHandler";
import { getNotificationPermissionStatus } from "@/features/notifications/services/notificationPermissions";
import { getExpoProjectId, setupAndroidNotificationChannel } from "@/features/notifications/services/notificationToken";
import { useAuth } from "@/features/auth/hooks/useAuth";

type NotificationSubscription = {
  remove: () => void;
};

type ExpoConfigWithVersion = {
  version?: string;
};

function getCurrentAppVersion(): string | null {
  const expoConfig = Constants.expoConfig as ExpoConfigWithVersion | null;
  const version = expoConfig?.version ?? null;
  if (!version) {
    return null;
  }

  const trimmedVersion = version.trim();
  return trimmedVersion.length > 0 ? trimmedVersion : null;
}

function getPlatformForPushRegistration(): "ios" | "android" | null {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return Platform.OS;
  }

  return null;
}

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const { handleNotificationResponse } = useNotificationResponseHandler();
  const pendingResponseRef = useRef<Notifications.NotificationResponse | null>(null);
  const canHandleNotificationResponses = !isInitializing && isAuthenticated;

  const handleNotificationResponseWhenReady = useCallback(
    (response: Notifications.NotificationResponse | null) => {
      if (!response) {
        return;
      }

      if (!canHandleNotificationResponses) {
        pendingResponseRef.current = response;
        return;
      }

      pendingResponseRef.current = null;
      handleNotificationResponse(response);
    },
    [canHandleNotificationResponses, handleNotificationResponse]
  );

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }, []);

  useEffect(() => {
    void setupAndroidNotificationChannel().catch(() => {
      // Channel setup failures should not block app startup.
    });
  }, []);

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!isAuthenticated) {
      pendingResponseRef.current = null;
      return;
    }

    const pendingResponse = pendingResponseRef.current;
    if (!pendingResponse) {
      return;
    }

    pendingResponseRef.current = null;
    handleNotificationResponse(pendingResponse);
  }, [handleNotificationResponse, isAuthenticated, isInitializing]);

  useEffect(() => {
    let isMounted = true;

    const handleTokenRefresh = async (token: string) => {
      if (!isMounted || !user?.id) {
        return;
      }

      const platform = getPlatformForPushRegistration();
      if (!platform) {
        return;
      }

      let projectId: string | null = null;
      try {
        projectId = getExpoProjectId();
      } catch {
        projectId = null;
      }

      try {
        const permission = await getNotificationPermissionStatus();
        if (!permission.isGranted) {
          await unregisterPushToken(token);
          return;
        }

        await registerPushToken({
          token,
          platform,
          tokenType: "expo",
          projectId,
          appVersion: getCurrentAppVersion(),
        });

        // Keeps preferences row present for recipient-side queue checks.
        await upsertNotificationPreferences({
          userId: user.id,
        });
      } catch {
        // Listener registration is best-effort only.
      }
    };

    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      // Intentionally no persistent storage or read-receipt state.
    });

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(handleNotificationResponseWhenReady);

    let tokenSubscription: NotificationSubscription | null = null;
    if (typeof Notifications.addPushTokenListener === "function") {
      tokenSubscription = Notifications.addPushTokenListener((event) => {
        void handleTokenRefresh(event.data);
      });
    }

    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!isMounted || !response) {
          return;
        }

        handleNotificationResponseWhenReady(response);
      })
      .catch(() => {
        // No-op: startup should continue even if payload inspection fails.
      });

    return () => {
      isMounted = false;
      receivedSubscription.remove();
      responseSubscription.remove();
      tokenSubscription?.remove();
    };
  }, [handleNotificationResponseWhenReady, user?.id]);

  return children;
}
