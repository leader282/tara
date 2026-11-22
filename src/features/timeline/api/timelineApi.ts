import type { PostgrestError } from "@supabase/supabase-js";

import {
  DEFAULT_TIMELINE_PAGE_SIZE,
  TIMELINE_RETENTION_DAYS,
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
  TimelineQueryParams,
  TimelineItemRow,
} from "@/features/timeline/types";
import { formatTimelineDateTime } from "@/lib/dates/format";
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

// Each card's details line says the rest, so titles stay short and never repeat it.
const TIMELINE_TITLES: Record<TimelineDisplayItemType, string> = {
  presence_sent: "Pulse shared",
  ritual_completed: "Ritual completed",
  capsule_created: "Memory capsule created",
  capsule_opened: "Memory capsule opened",
  countdown_updated: "Reunion plans updated",
  parallel_moment_completed: "Parallel moment completed",
  unknown: "Shared moment",
};

export function mapTimelineRow(row: TimelineItemRow): TimelineDisplayItem {
  const type = isTimelineItemType(row.type) ? row.type : "unknown";
  const payload = parseTimelinePayload(row.type, row.payload);
  const navigationTarget = getTimelineNavigationTarget({ type, payload });
  const typeDisplay = getTimelineTypeDisplay(type);

  return {
    id: row.id,
    coupleId: row.couple_id,
    actorId: row.actor_id,
    title: TIMELINE_TITLES[type],
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
    const oldestShown = new Date(Date.now() - TIMELINE_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from("timeline_items")
      .select(TIMELINE_SELECT)
      .eq("couple_id", coupleId)
      .gte("created_at", oldestShown.toISOString())
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
