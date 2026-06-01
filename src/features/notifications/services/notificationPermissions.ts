import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { notificationPermissionStateSchema } from "@/features/notifications/schemas";
import type {
  NotificationPermissionSnapshot,
  NotificationPermissionState,
} from "@/features/notifications/types";
import {
  NotificationActionError,
  toNotificationActionError,
} from "@/lib/errors/notificationErrorMessages";

const NEVER_EXPIRES_VALUE = "never";

function toPermissionSnapshot(
  permissionResponse: Notifications.NotificationPermissionsStatus,
): NotificationPermissionSnapshot {
  const status = mapPermissionStatus(permissionResponse);
  const expires = permissionResponse.expires ?? NEVER_EXPIRES_VALUE;

  return {
    status,
    isGranted: status === "granted" || status === "provisional",
    canAskAgain: permissionResponse.canAskAgain,
    expires,
  };
}

export function mapPermissionStatus(
  permissionResponse: Notifications.NotificationPermissionsStatus,
): NotificationPermissionState {
  const iosStatus = permissionResponse.ios?.status;
  if (
    permissionResponse.granted &&
    (iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
      iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL)
  ) {
    return "provisional";
  }

  if (permissionResponse.granted) {
    return "granted";
  }

  const normalizedStatus = notificationPermissionStateSchema.safeParse(
    permissionResponse.status,
  );
  if (normalizedStatus.success) {
    return normalizedStatus.data;
  }

  return "undetermined";
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionSnapshot> {
  try {
    if (Platform.OS === "web") {
      return {
        status: "denied",
        isGranted: false,
        canAskAgain: false,
        expires: NEVER_EXPIRES_VALUE,
      };
    }

    const permissionResponse = await Notifications.getPermissionsAsync();
    return toPermissionSnapshot(permissionResponse);
  } catch (error) {
    throw toNotificationActionError(error);
  }
}

export async function canAskForNotifications(): Promise<boolean> {
  const permission = await getNotificationPermissionStatus();
  if (permission.isGranted) {
    return false;
  }

  return permission.canAskAgain;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionSnapshot> {
  try {
    if (Platform.OS === "web") {
      throw new NotificationActionError("permission_unavailable");
    }

    const currentPermission = await getNotificationPermissionStatus();
    if (currentPermission.isGranted) {
      return currentPermission;
    }

    if (!currentPermission.canAskAgain && currentPermission.status === "denied") {
      return currentPermission;
    }

    const permissionResponse = await Notifications.requestPermissionsAsync();
    return toPermissionSnapshot(permissionResponse);
  } catch (error) {
    throw toNotificationActionError(error);
  }
}
