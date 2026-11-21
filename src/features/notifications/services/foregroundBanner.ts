import { NOTIFICATION_TYPE_EMOJI, NOTIFICATION_TYPES } from "@/features/notifications/constants";
import { resolveNotificationRouteFromData } from "@/features/notifications/services/notificationNavigation";
import type { NotificationRoute, NotificationType } from "@/features/notifications/types";
import { PRESENCE_PULSE_OPTIONS } from "@/features/presence/constants";

type NotificationContentLike = {
  title?: string | null;
  body?: string | null;
  data?: unknown;
};

export type ForegroundBanner = {
  type: NotificationType;
  emoji: string | null;
  title: string;
  message: string | null;
  route: NotificationRoute | null;
  presenceEventId: string | null;
};

const COPY_EMOJIS = Array.from(
  new Set([
    ...Object.values(PRESENCE_PULSE_OPTIONS).map((option) => option.emoji),
    ...Object.values(NOTIFICATION_TYPE_EMOJI),
  ])
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === "string" && (NOTIFICATION_TYPES as readonly string[]).includes(value);
}

function splitLeadingEmoji(title: string): { emoji: string | null; text: string } {
  for (const emoji of COPY_EMOJIS) {
    if (title.startsWith(`${emoji} `)) {
      return { emoji, text: title.slice(emoji.length).trim() };
    }
  }

  return { emoji: null, text: title };
}

/** Maps a push that arrived while Tara is open to an in-app banner. */
export function toForegroundBanner(content: NotificationContentLike): ForegroundBanner | null {
  const data = isRecord(content.data) ? content.data : {};
  const type = data.type;
  const title = content.title?.trim();

  if (!isNotificationType(type) || !title) {
    return null;
  }

  const { emoji, text } = splitLeadingEmoji(title);
  const message = content.body?.trim();

  return {
    type,
    emoji: emoji ?? NOTIFICATION_TYPE_EMOJI[type],
    title: text,
    message: message && message.length > 0 ? message : null,
    route: resolveNotificationRouteFromData(content.data),
    presenceEventId: typeof data.presence_event_id === "string" ? data.presence_event_id : null,
  };
}
