import { useEffect, useRef } from "react";

import { AppState } from "react-native";

import {
  registerPushToken,
  upsertNotificationPreferences,
} from "@/features/notifications/api/notificationsApi";
import { getNotificationPermissionStatus } from "@/features/notifications/services/notificationPermissions";
import { registerCurrentDeviceForPush } from "@/features/notifications/services/notificationToken";

// Settings only offers "Enable gentle notifications" while permission is missing, so a phone that
// already allows notifications (after a reinstall, a new sign-in, or a token clean-up) would never
// register for push. Register a signed-in user's device whenever permission is granted: once per
// session, retried on returning to the app (say, after allowing notifications in system settings).
export function useAutoRegisterPushToken(userId: string | null | undefined): void {
  const registeredUserIdRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      registeredUserIdRef.current = null;
      return;
    }

    let cancelled = false;

    const registerIfAllowed = async () => {
      if (registeredUserIdRef.current === userId || inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      try {
        const permission = await getNotificationPermissionStatus();
        if (cancelled || !permission.isGranted) {
          return;
        }

        await registerCurrentDeviceForPush({ registerToken: registerPushToken });
        await upsertNotificationPreferences({ userId });
        if (!cancelled) {
          registeredUserIdRef.current = userId;
        }
      } catch {
        // Best-effort: enabling from Settings > Notifications shows registration errors.
      } finally {
        inFlightRef.current = false;
      }
    };

    void registerIfAllowed();
    const subscription = AppState.addEventListener("change", (appState) => {
      if (appState === "active") {
        void registerIfAllowed();
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [userId]);
}
