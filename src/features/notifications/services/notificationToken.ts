import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import {
  NOTIFICATION_ANDROID_CHANNEL_ID,
  NOTIFICATION_ANDROID_CHANNEL_NAME,
} from "@/features/notifications/constants";
import type {
  RegisterCurrentDeviceForPushInput,
  RegisterCurrentDeviceForPushResult,
} from "@/features/notifications/types";
import { getNotificationPermissionStatus } from "@/features/notifications/services/notificationPermissions";
import {
  NotificationActionError,
  toNotificationActionError,
} from "@/lib/errors/notificationErrorMessages";

type ExpoConfigWithEas = {
  extra?: {
    eas?: {
      projectId?: string;
    };
  };
  version?: string;
};

function getCurrentPlatform(): "ios" | "android" {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return Platform.OS;
  }

  throw new NotificationActionError("permission_unavailable");
}

function getOptionalAppVersion(): string | null {
  const expoConfig = Constants.expoConfig as ExpoConfigWithEas | null;
  const version = expoConfig?.version ?? null;
  return version && version.trim().length > 0 ? version : null;
}

export function getExpoProjectId(): string {
  const expoConfig = Constants.expoConfig as ExpoConfigWithEas | null;
  const projectIdFromEasConfig = Constants.easConfig?.projectId;
  const projectIdFromExtra = expoConfig?.extra?.eas?.projectId;
  const projectIdFromEnv = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  const projectIdCandidates = [
    projectIdFromEasConfig,
    projectIdFromExtra,
    projectIdFromEnv,
  ];

  for (const candidate of projectIdCandidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  throw new NotificationActionError("project_id_missing");
}

export async function getExpoPushToken(projectId: string = getExpoProjectId()): Promise<string> {
  try {
    if (!Device.isDevice) {
      throw new NotificationActionError("physical_device_required");
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResponse.data?.trim();

    if (!token) {
      throw new NotificationActionError("token_unavailable");
    }

    return token;
  } catch (error) {
    throw toNotificationActionError(error);
  }
}

export async function getNativeDeviceToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      return null;
    }

    const nativeTokenResponse = await Notifications.getDevicePushTokenAsync();
    if (typeof nativeTokenResponse.data === "string") {
      const trimmedToken = nativeTokenResponse.data.trim();
      return trimmedToken.length > 0 ? trimmedToken : null;
    }

    return null;
  } catch {
    return null;
  }
}

export async function setupAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(NOTIFICATION_ANDROID_CHANNEL_ID, {
    name: NOTIFICATION_ANDROID_CHANNEL_NAME,
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 120, 80, 120],
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    bypassDnd: false,
    showBadge: false,
  });
}

export async function registerCurrentDeviceForPush(
  input: RegisterCurrentDeviceForPushInput,
): Promise<RegisterCurrentDeviceForPushResult> {
  try {
    const permission = await getNotificationPermissionStatus();
    if (!permission.isGranted) {
      throw new NotificationActionError(
        permission.canAskAgain ? "permission_denied" : "permission_blocked",
      );
    }

    const platform = getCurrentPlatform();
    await setupAndroidNotificationChannel();

    const projectId = getExpoProjectId();
    const expoPushToken = await getExpoPushToken(projectId);
    const nativeDeviceToken = await getNativeDeviceToken();
    const appVersion = getOptionalAppVersion();

    const registeredToken = await input.registerToken({
      token: expoPushToken,
      platform,
      tokenType: "expo",
      nativeToken: nativeDeviceToken,
      deviceId: null,
      projectId,
      appVersion,
    });

    return {
      projectId,
      expoPushToken,
      nativeDeviceToken,
      registeredToken,
    };
  } catch (error) {
    throw toNotificationActionError(error);
  }
}

export async function unregisterCurrentDeviceForPush(input: {
  unregisterToken: (token: string) => Promise<boolean>;
}): Promise<boolean> {
  try {
    const permission = await getNotificationPermissionStatus();
    if (!permission.isGranted || !Device.isDevice) {
      return false;
    }

    const projectId = getExpoProjectId();
    const expoPushToken = await getExpoPushToken(projectId);

    return input.unregisterToken(expoPushToken);
  } catch (error) {
    throw toNotificationActionError(error);
  }
}
