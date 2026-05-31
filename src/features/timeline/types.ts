import type { z } from "zod";

import type { TIMELINE_ITEM_TYPES } from "@/features/timeline/constants";
import type {
  capsuleCreatedPayloadSchema,
  capsuleOpenedPayloadSchema,
  countdownUpdatedPayloadSchema,
  presenceSentPayloadSchema,
  ritualCompletedPayloadSchema,
  unknownPayloadSchema,
} from "@/features/timeline/schemas";
import type { Tables } from "@/lib/supabase/database.types";

export type TimelineItemType = (typeof TIMELINE_ITEM_TYPES)[number];
export type TimelineDisplayItemType = TimelineItemType | "unknown";
export type TimelineItemRow = Tables<"timeline_items">;

export type PresenceSentPayload = z.infer<typeof presenceSentPayloadSchema>;
export type RitualCompletedPayload = z.infer<typeof ritualCompletedPayloadSchema>;
export type CapsuleCreatedPayload = z.infer<typeof capsuleCreatedPayloadSchema>;
export type CapsuleOpenedPayload = z.infer<typeof capsuleOpenedPayloadSchema>;
export type CountdownUpdatedPayload = z.infer<typeof countdownUpdatedPayloadSchema>;
export type UnknownPayload = z.infer<typeof unknownPayloadSchema>;

export type TimelinePayload =
  | { type: "presence_sent"; value: PresenceSentPayload }
  | { type: "ritual_completed"; value: RitualCompletedPayload }
  | { type: "capsule_created"; value: CapsuleCreatedPayload }
  | { type: "capsule_opened"; value: CapsuleOpenedPayload }
  | { type: "countdown_updated"; value: CountdownUpdatedPayload }
  | { type: "parallel_moment_completed"; value: UnknownPayload }
  | { type: "unknown"; value: UnknownPayload };

export type TimelineCursor = number;

export type TimelineNavigationTarget =
  | { pathname: "/(couple)/rituals/[ritualId]"; params: { ritualId: string } }
  | { pathname: "/(couple)/capsules/[capsuleId]"; params: { capsuleId: string } }
  | { pathname: "/(couple)/edit-meetup" }
  | { pathname: "/(couple)" }
  | null;

export type TimelineDisplayItem = {
  id: string;
  coupleId: string;
  actorId: string | null;
  title: string;
  subtitle: string | null;
  createdAt: string;
  createdAtLabel: string;
  type: TimelineDisplayItemType;
  rawType: string;
  typeLabel: string;
  iconText: string;
  payload: TimelinePayload;
  navigationTarget: TimelineNavigationTarget;
};

export type TimelinePage = {
  items: TimelineDisplayItem[];
  nextPageParam: TimelineCursor | null;
  hasMore: boolean;
  pageSize: number;
};

export type TimelineQueryParams = {
  coupleId: string;
  pageParam?: TimelineCursor;
  pageSize?: number;
};
