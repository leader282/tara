import type {
  NOTIFICATION_PERMISSION_STATES,
  NOTIFICATION_TYPES,
} from "@/features/notifications/constants";
import type { Database, Tables } from "@/lib/supabase/database.types";

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type NotificationPermissionState = (typeof NOTIFICATION_PERMISSION_STATES)[number];

export type NotificationPreferences = Tables<"notification_preferences">;
export type PushTokenRecord = Tables<"push_tokens">;
export type RegisteredPushToken =
  Database["public"]["Functions"]["register_push_token"]["Returns"];

export type RegisterPushTokenInput = {
  token: string;
  platform: "ios" | "android";
  tokenType?: "expo" | "native";
  nativeToken?: string | null;
  deviceId?: string | null;
  projectId?: string | null;
  appVersion?: string | null;
};

export type UpsertNotificationPreferencesInput = {
  userId: string;
  presenceEnabled?: boolean;
  ritualsEnabled?: boolean;
  capsulesEnabled?: boolean;
  countdownEnabled?: boolean;
  quietHoursEnabled?: boolean;
};

export type NotificationPermissionSnapshot = {
  status: NotificationPermissionState;
  isGranted: boolean;
  canAskAgain: boolean;
  expires: string | number;
};

export type RegisterCurrentDeviceForPushInput = {
  registerToken: (input: RegisterPushTokenInput) => Promise<RegisteredPushToken>;
};

export type RegisterCurrentDeviceForPushResult = {
  projectId: string;
  expoPushToken: string;
  nativeDeviceToken: string | null;
  registeredToken: RegisteredPushToken;
};

export type EnableNotificationsResult = {
  permission: NotificationPermissionSnapshot;
  tokenRegistration: RegisterCurrentDeviceForPushResult;
  notificationPreferences: NotificationPreferences;
};

export type NotificationRoute =
  | "/(couple)"
  | "/(couple)/rituals"
  | "/(couple)/capsules"
  | `/(couple)/capsules/${string}`;
