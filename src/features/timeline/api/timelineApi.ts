import type { PostgrestError } from "@supabase/supabase-js";

import {
  DEFAULT_TIMELINE_PAGE_SIZE,
} from "@/features/timeline/constants";
import { getTimelineTypeDisplay, isTimelineItemType, parseTimelinePayload } from "@/features/timeline/mappers";
import {
  timelineCoupleIdSchema,
  timelinePageParamSchema,
  timelinePageSizeSchema,
} from "@/features/timeline/schemas";
import type {
  TimelineDisplayItem,
  TimelineDisplayItemType,
  TimelineNavigationTarget,
  TimelinePage,
  TimelinePayload,
  TimelineQueryParams,
  TimelineItemRow,
} from "@/features/timeline/types";
import { formatDateOnly, formatTimelineDateTime } from "@/lib/dates/format";
import { TimelineActionError, getTimelineErrorMessage, toTimelineActionError } from "@/lib/errors/timelineErrorMessages";
import { supabase } from "@/lib/supabase/client";

const TIMELINE_SELECT = `
  id,
  couple_id,
  actor_id,
  type,
  payload,
  created_at
`;

function throwIfTimelineError(error: PostgrestError | null): void {
  if (!error) {
    return;
  }

  throw new TimelineActionError("unknown", getTimelineErrorMessage(error));
}

export function getTimelineNavigationTarget(item: Pick<TimelineDisplayItem, "type" | "payload">): TimelineNavigationTarget {
  if (item.type === "presence_sent") {
    return { pathname: "/(couple)" };
  }

  if (item.type === "ritual_completed") {
    const ritualId = item.payload.type === "ritual_completed" ? item.payload.value.couple_ritual_id : undefined;
    if (!ritualId) {
      return null;
    }

    return {
      pathname: "/(couple)/rituals/[ritualId]",
      params: { ritualId },
    };
  }

  if (item.type === "capsule_created" || item.type === "capsule_opened") {
    const capsuleId =
      item.payload.type === "capsule_created" || item.payload.type === "capsule_opened"
        ? item.payload.value.capsule_id
        : undefined;
    if (!capsuleId) {
      return null;
    }

    return {
      pathname: "/(couple)/capsules/[capsuleId]",
      params: { capsuleId },
    };
  }

  if (item.type === "countdown_updated") {
    return { pathname: "/(couple)/edit-meetup" };
  }

  return null;
}

function formatEnumLabel(value: string): string {
  return value
    .trim()
    .split(/[_\s-]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getSafeTimelineText(
  type: TimelineDisplayItemType,
  payload: TimelinePayload
): Pick<TimelineDisplayItem, "title" | "subtitle"> {
  switch (type) {
    case "presence_sent": {
      const pulseType = payload.type === "presence_sent" ? payload.value.pulse_type : null;
      return {
        title: "Presence pulse shared",
        subtitle: pulseType ? `Pulse: ${formatEnumLabel(pulseType)}.` : "A gentle pulse was shared.",
      };
    }
    case "ritual_completed": {
      const scheduledFor = payload.type === "ritual_completed" ? payload.value.scheduled_for : null;
      const scheduledForLabel = formatDateOnly(scheduledFor);
      return {
        title: "Ritual completed",
        subtitle: scheduledForLabel ? `Completed for ${scheduledForLabel}.` : "A shared ritual was completed.",
      };
    }
    case "capsule_created": {
      const unlockAt = payload.type === "capsule_created" ? payload.value.unlock_at : null;
      const unlockLabel = formatTimelineDateTime(unlockAt);
      return {
        title: "Memory capsule created",
        subtitle: unlockLabel ? `Unlocks ${unlockLabel}.` : "Saved to open later.",
      };
    }
    case "capsule_opened": {
      const openedAt = payload.type === "capsule_opened" ? payload.value.opened_at : null;
      const openedLabel = formatTimelineDateTime(openedAt);
      return {
        title: "Memory capsule opened",
        subtitle: openedLabel ? `Opened ${openedLabel}.` : "A capsule was opened.",
      };
    }
    case "countdown_updated":
      return {
        title: "Reunion countdown updated",
        subtitle: "Meetup details were updated.",
      };
    case "parallel_moment_completed":
      return {
        title: "Parallel moment completed",
        subtitle: "A shared moment was saved.",
      };
    case "unknown":
    default:
      return {
        title: "Shared moment",
        subtitle: "Saved safely for both of you.",
      };
  }
}

export function mapTimelineRow(row: TimelineItemRow): TimelineDisplayItem {
  const type = isTimelineItemType(row.type) ? row.type : "unknown";
  const payload = parseTimelinePayload(row.type, row.payload);
  const navigationTarget = getTimelineNavigationTarget({ type, payload });
  const typeDisplay = getTimelineTypeDisplay(type);
  const safeTimelineText = getSafeTimelineText(type, payload);

  return {
    id: row.id,
    coupleId: row.couple_id,
    actorId: row.actor_id,
    title: safeTimelineText.title,
    subtitle: safeTimelineText.subtitle,
    createdAt: row.created_at,
    createdAtLabel: formatTimelineDateTime(row.created_at) ?? "Recent",
    type,
    rawType: row.type,
    typeLabel: typeDisplay.label,
    iconText: typeDisplay.iconText,
    payload,
    navigationTarget,
  };
}

export async function getTimelinePage(params: TimelineQueryParams): Promise<TimelinePage> {
  try {
    const coupleId = timelineCoupleIdSchema.parse(params.coupleId);
    const pageParam = timelinePageParamSchema.parse(params.pageParam ?? 0);
    const pageSize = timelinePageSizeSchema.parse(params.pageSize ?? DEFAULT_TIMELINE_PAGE_SIZE);

    const from = pageParam;
    const to = pageParam + pageSize - 1;

    const { data, error } = await supabase
      .from("timeline_items")
      .select(TIMELINE_SELECT)
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    throwIfTimelineError(error);

    const rows = (data ?? []) as TimelineItemRow[];
    const items = rows.map((row) => mapTimelineRow(row));
    const hasMore = rows.length === pageSize;
    const nextPageParam = hasMore ? from + rows.length : null;

    return {
      items,
      nextPageParam,
      hasMore,
      pageSize,
    };
  } catch (error) {
    throw toTimelineActionError(error);
  }
}
