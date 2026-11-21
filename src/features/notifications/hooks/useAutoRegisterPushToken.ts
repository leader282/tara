import { useEffect, useRef } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

import {
  registerPushToken,
  upsertNotificationPreferences,
} from "@/features/notifications/api/notificationsApi";
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
} from "@/features/notifications/services/notificationPermissions";
import { registerCurrentDeviceForPush } from "@/features/notifications/services/notificationToken";

// Set once this install has shown the system prompt, so it never nags after a "no".
export const NOTIFICATION_PROMPT_SHOWN_KEY = "tara.notifications.prompt-shown";

type AutoRegisterOptions = {
  // Show the system permission prompt if this install has never shown it (first use).
  askIfNeverAsked?: boolean;
};

async function claimFirstPrompt(): Promise<boolean> {
  if (await AsyncStorage.getItem(NOTIFICATION_PROMPT_SHOWN_KEY)) {
    return false;
  }

  await AsyncStorage.setItem(NOTIFICATION_PROMPT_SHOWN_KEY, new Date().toISOString());
  return true;
}

// Settings only offers "Enable gentle notifications" while permission is missing, so a phone that
// already allows notifications (after a reinstall, a new sign-in, or a token clean-up) would never
// register for push. Register a signed-in user's device whenever permission is granted: once per
// session, retried on returning to the app (say, after allowing notifications in system settings).
export function useAutoRegisterPushToken(
  userId: string | null | undefined,
  { askIfNeverAsked = false }: AutoRegisterOptions = {}
): void {
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
        let permission = await getNotificationPermissionStatus();
        // Android 13+ reports a permission it has never asked for as "denied", so whether the
        // prompt can still appear is the signal, not the status.
        if (!permission.isGranted && permission.canAskAgain && askIfNeverAsked && (await claimFirstPrompt())) {
          permission = await requestNotificationPermission();
        }
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
  }, [askIfNeverAsked, userId]);
}
