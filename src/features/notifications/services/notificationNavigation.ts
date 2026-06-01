import type * as Notifications from "expo-notifications";

import { notificationTapPayloadSchema, notificationTypeSchema } from "@/features/notifications/schemas";
import type { NotificationRoute } from "@/features/notifications/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toNotificationType(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  const parsedType = notificationTypeSchema.safeParse(normalized);
  return parsedType.success ? parsedType.data : null;
}

function toUuidOrNull(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return UUID_PATTERN.test(normalized) ? normalized : null;
}

export function resolveNotificationRouteFromData(data: unknown): NotificationRoute | null {
  const parsedPayload = notificationTapPayloadSchema.safeParse(data);
  if (!parsedPayload.success) {
    return null;
  }

  const payload = parsedPayload.data;
  const notificationType = toNotificationType(payload.type);
  if (!notificationType) {
    return null;
  }

  switch (notificationType) {
    case "presence_pulse":
      return "/(couple)";
    case "ritual_ready":
    case "ritual_reminder":
      return "/(couple)/rituals";
    case "capsule_unlocked": {
      const capsuleId = toUuidOrNull(payload.capsuleId) ?? toUuidOrNull(payload.capsule_id);
      if (!capsuleId) {
        return "/(couple)/capsules";
      }

      return `/(couple)/capsules/${capsuleId}`;
    }
    case "countdown_reminder":
      return "/(couple)";
    default:
      return null;
  }
}

export function resolveNotificationRouteFromResponse(
  response: Notifications.NotificationResponse | null,
): NotificationRoute | null {
  if (!response) {
    return null;
  }

  return resolveNotificationRouteFromData(response.notification.request.content.data);
}
