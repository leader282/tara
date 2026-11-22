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

// Timeline rows only record that a pulse had a note; the note itself stays on the pulse, which
// only the couple can read. Missing notes just leave the card without one.
async function getPulseMessages(rows: TimelineItemRow[]): Promise<Map<string, string>> {
  const presenceEventIds = rows.flatMap((row) => {
    const payload = parseTimelinePayload(row.type, row.payload);
    return payload.type === "presence_sent" && payload.value.presence_event_id
      ? [payload.value.presence_event_id]
      : [];
  });

  if (presenceEventIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("presence_events")
    .select("id, optional_message")
    .in("id", presenceEventIds);

  if (error) {
    return new Map();
  }

  return new Map(
    (data ?? []).flatMap((event) => {
      const message = event.optional_message?.trim();
      return message ? [[event.id, message] as const] : [];
    })
  );
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

export function mapTimelineRow(
  row: TimelineItemRow,
  pulseMessages: ReadonlyMap<string, string> = new Map()
): TimelineDisplayItem {
  const type = isTimelineItemType(row.type) ? row.type : "unknown";
  const payload = parseTimelinePayload(row.type, row.payload);
  const typeDisplay = getTimelineTypeDisplay(type);
  const presenceEventId = payload.type === "presence_sent" ? payload.value.presence_event_id : undefined;

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
    message: presenceEventId ? (pulseMessages.get(presenceEventId) ?? null) : null,
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
    const pulseMessages = await getPulseMessages(rows);
    const items = rows.map((row) => mapTimelineRow(row, pulseMessages));
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
