import {
  TIMELINE_ITEM_TYPES,
  TIMELINE_TYPE_DISPLAY,
  TIMELINE_UNKNOWN_TYPE_DISPLAY,
} from "@/features/timeline/constants";
import {
  capsuleCreatedPayloadSchema,
  capsuleOpenedPayloadSchema,
  countdownUpdatedPayloadSchema,
  presenceSentPayloadSchema,
  ritualCompletedPayloadSchema,
  timelinePayloadObjectSchema,
  unknownPayloadSchema,
} from "@/features/timeline/schemas";
import type {
  TimelineDisplayItemType,
  TimelineItemRow,
  TimelineItemType,
  TimelinePayload,
} from "@/features/timeline/types";
import { logger } from "@/lib/logging/logger";

declare const __DEV__: boolean;

const PRIVATE_PAYLOAD_KEYS = new Set([
  "note",
  "text_response",
  "response_text",
  "optional_message",
  "storage_path",
  "media_path",
  "media_asset_id",
]);

function toPayloadObject(payload: TimelineItemRow["payload"]): Record<string, unknown> {
  const parsedPayload = timelinePayloadObjectSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return {};
  }

  return parsedPayload.data;
}

function getPrivatePayloadKeys(payload: Record<string, unknown>): string[] {
  return Object.keys(payload).filter((key) => PRIVATE_PAYLOAD_KEYS.has(key));
}

function stripPrivatePayloadKeys(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => !PRIVATE_PAYLOAD_KEYS.has(key))
  );
}

function warnIgnoredPrivateFields(rawType: string, privateKeys: string[]): void {
  if (!__DEV__ || privateKeys.length === 0) {
    return;
  }

  logger.warn("[timeline] Ignored private payload fields", { privateKeys, rawType });
}

export function isTimelineItemType(value: string): value is TimelineItemType {
  return (TIMELINE_ITEM_TYPES as readonly string[]).includes(value);
}

export function getTimelineTypeDisplay(type: TimelineDisplayItemType): {
  label: string;
  iconText: string;
} {
  if (type === "unknown") {
    return TIMELINE_UNKNOWN_TYPE_DISPLAY;
  }

  return TIMELINE_TYPE_DISPLAY[type];
}

export function parseTimelinePayload(rawType: string, payload: TimelineItemRow["payload"]): TimelinePayload {
  const payloadObject = toPayloadObject(payload);
  const privateKeys = getPrivatePayloadKeys(payloadObject);
  const safePayloadObject = stripPrivatePayloadKeys(payloadObject);
  warnIgnoredPrivateFields(rawType, privateKeys);

  const toUnknownPayload = (): TimelinePayload => ({
    type: "unknown",
    value: unknownPayloadSchema.parse(safePayloadObject),
  });

  if (!isTimelineItemType(rawType)) {
    return toUnknownPayload();
  }

  switch (rawType) {
    case "presence_sent": {
      const parsedPayload = presenceSentPayloadSchema.safeParse(safePayloadObject);
      if (!parsedPayload.success) {
        return toUnknownPayload();
      }

      return {
        type: rawType,
        value: parsedPayload.data,
      };
    }
    case "ritual_completed": {
      const parsedPayload = ritualCompletedPayloadSchema.safeParse(safePayloadObject);
      if (!parsedPayload.success) {
        return toUnknownPayload();
      }

      return {
        type: rawType,
        value: parsedPayload.data,
      };
    }
    case "capsule_created": {
      const parsedPayload = capsuleCreatedPayloadSchema.safeParse(safePayloadObject);
      if (!parsedPayload.success) {
        return toUnknownPayload();
      }

      return {
        type: rawType,
        value: parsedPayload.data,
      };
    }
    case "capsule_opened": {
      const parsedPayload = capsuleOpenedPayloadSchema.safeParse(safePayloadObject);
      if (!parsedPayload.success) {
        return toUnknownPayload();
      }

      return {
        type: rawType,
        value: parsedPayload.data,
      };
    }
    case "countdown_updated": {
      const parsedPayload = countdownUpdatedPayloadSchema.safeParse(safePayloadObject);
      if (!parsedPayload.success) {
        return toUnknownPayload();
      }

      return {
        type: rawType,
        value: parsedPayload.data,
      };
    }
    case "parallel_moment_completed":
      return {
        type: rawType,
        value: unknownPayloadSchema.parse(safePayloadObject),
      };
    default:
      return toUnknownPayload();
  }
}
